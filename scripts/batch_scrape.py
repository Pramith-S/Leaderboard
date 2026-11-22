import os
import re
import sys
import time
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from bs4 import BeautifulSoup
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import Session

NEON_URL = "postgresql+psycopg://neondb_owner:npg_Lv8s6FzgVdhx@ep-little-lab-ar3njq81.c-4.us-west-2.aws.neon.tech/neondb?sslmode=require"
LOCAL_URL = "postgresql+psycopg://tracker_user:tracker_password@postgres:5432/google_skills_tracker"

from backend.database.models import User, Badge, Completion, Lab, ScrapeLog
from backend.course_parser import parse_course
from backend.excel_manager import load_participants
from backend.main import _course_for_badge, _date_value, _normalize_text, _expected_badge_names, _import_users

EARNED_PATTERN = re.compile(
    r"Earned\s+([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4}|\d{4}-\d{2}-\d{2})",
    re.IGNORECASE,
)
BADGE_ID_PATTERN = re.compile(r"/(?:badges|badge)/([A-Za-z0-9_-]+)(?:/|$)", re.IGNORECASE)

def extract_badges(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    candidates = []
    seen = set()

    def normalize(val):
        return " ".join((val or "").split())

    badge_cards = soup.select('.profile-badge, [class*="profile-badge"], ql-badge, [data-badge-id]')
    for card in badge_cards:
        anchor = card.select_one('a[href*="/badges/"], a[href*="/badge/"], a.badge-image, a[href]')
        title_el = card.select_one('.ql-title-medium, .ql-headline-medium, [class*="title"], h1, h2, h3')
        date_el = None
        for el in card.select('.ql-body-medium, [class*="body"], span, p, time'):
            txt = el.get_text()
            if "earned" in txt.lower():
                date_el = el
                break

        href = (anchor.get("href") if anchor else "") or ""
        title = normalize(title_el.get_text() if title_el else "")
        date_text = normalize(date_el.get_text() if date_el else "")
        card_text = normalize(card.get_text(" "))
        link_text = normalize(anchor.get_text() if anchor else "") or title
        combined_card_text = normalize(f"{title}\n{date_text}\n{card_text}")

        m_id = BADGE_ID_PATTERN.search(href)
        if m_id:
            badge_id = m_id.group(1)
            if badge_id not in seen:
                seen.add(badge_id)
                m_date = EARNED_PATTERN.search(date_text or card_text)
                candidates.append({
                    "badge_id": badge_id,
                    "badge_name": title or link_text,
                    "date": m_date.group(1).strip() if m_date else None,
                    "status": "Done",
                    "url": href,
                })
    return candidates

def scrape_user(user_id: int, name: str, url: str) -> tuple[int, str, list[dict], str | None]:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    try:
        resp = requests.get(url, headers=headers, timeout=12)
        if resp.status_code == 200:
            badges = extract_badges(resp.text)
            return user_id, name, badges, None
        else:
            return user_id, name, [], f"HTTP {resp.status_code}"
    except Exception as e:
        return user_id, name, [], str(e)

def sync_completions(db_url: str, scraped_results: list[tuple[int, str, list[dict], str | None]], course_rows: list[dict]):
    engine = create_engine(db_url)
    now = datetime.now(timezone.utc)
    with Session(engine) as session:
        with session.begin():
            # Get existing labs and badges
            labs = list(session.scalars(select(Lab)).all())
            labs_by_url = {lab.url: lab for lab in labs}
            
            total_completions = 0
            for user_id, name, badges, err in scraped_results:
                status = "Failed" if err else "Success"
                log = ScrapeLog(
                    user_id=user_id,
                    status=status,
                    error_message=err,
                    started_at=now,
                    finished_at=now,
                    badges_found=len(badges),
                    new_badges_found=0,
                )
                session.add(log)
                
                if err or not badges:
                    continue
                    
                seen_badge_ids = set()
                new_badges_count = 0
                for earned in badges:
                    b_id = str(earned.get("badge_id") or "").strip()
                    b_name = str(earned.get("badge_name") or "").strip()
                    if not b_id or not b_name or b_id in seen_badge_ids:
                        continue
                    seen_badge_ids.add(b_id)
                    
                    course_row = _course_for_badge(course_rows, b_name)
                    if not course_row:
                        continue
                        
                    badge = session.get(Badge, b_id)
                    if badge is None:
                        badge = Badge(id=b_id, name=b_name, category=course_row.get("category", "Completion"))
                        session.add(badge)
                        session.flush()
                        new_badges_count += 1
                    else:
                        badge.name = b_name
                        
                    lab = labs_by_url.get(course_row.get("lab_url") or "")
                    if lab is None:
                        lab = Lab(
                            name=course_row["lab_name"],
                            item_type=course_row["item_type"],
                            total_credits=course_row["credits"],
                            url=course_row.get("lab_url") or "",
                            badge_id=badge.id,
                        )
                        session.add(lab)
                        session.flush()
                        labs_by_url[lab.url] = lab

                    comp = session.scalar(select(Completion).where(
                        Completion.user_id == user_id,
                        Completion.badge_id == badge.id,
                    ))
                    earned_at = _date_value(earned.get("date"))
                    if comp is None:
                        comp = Completion(
                            user_id=user_id,
                            badge_id=badge.id,
                            lab_id=lab.id,
                            is_completed=True,
                            earned_at=earned_at,
                            first_detected_at=now,
                            last_verified_at=now,
                        )
                        session.add(comp)
                        total_completions += 1
                    else:
                        comp.is_completed = True
                        comp.last_verified_at = now
                        if earned_at:
                            comp.earned_at = earned_at
                            
                log.new_badges_found = new_badges_count
            print(f"Synced {total_completions} completions to database {db_url[:40]}...")

def ensure_local_participants(local_db_url: str):
    engine = create_engine(local_db_url)
    participants = load_participants('/app/data/clean_participants.xlsx')
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM scrape_logs WHERE user_id <= 7"))
        conn.execute(text("DELETE FROM completions WHERE user_id <= 7"))
        conn.execute(text("DELETE FROM users WHERE id <= 7 OR public_profile_url LIKE '%11111111%'"))
    with Session(engine) as session:
        with session.begin():
            res = _import_users(session, participants)
            print("Local DB participant import result:", res)

if __name__ == "__main__":
    print("1. Ensuring 481 participants in local database...")
    try:
        ensure_local_participants(LOCAL_URL)
    except Exception as e:
        print("Note on local DB:", e)

    # Fetch users from Neon DB
    neon_engine = create_engine(NEON_URL)
    with Session(neon_engine) as session:
        users = list(session.execute(select(User.id, User.name, User.public_profile_url).order_by(User.id)).all())
    print(f"Found {len(users)} users to scrape.")
    
    course_rows = parse_course("/app/data/course.xlsx", sheet_name="GCP Labs & Courses")
    print(f"Loaded {len(course_rows)} course rows.")

    print("2. Starting parallel scrape of all profiles...")
    start_time = time.time()
    results = []
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(scrape_user, u[0], u[1], u[2]): u for u in users}
        for future in as_completed(futures):
            res = future.result()
            results.append(res)
            if len(results) % 100 == 0 or len(results) == len(users):
                print(f"Progress: {len(results)}/{len(users)} scraped...")
                
    elapsed = time.time() - start_time
    with_badges = [r for r in results if len(r[2]) > 0]
    print(f"Scrape completed in {elapsed:.2f}s! {len(with_badges)} users have earned badges.")

    # 3. Sync to Neon DB
    print("3. Syncing completions to Neon DB...")
    sync_completions(NEON_URL, results, course_rows)

    # 4. Sync to Local DB
    print("4. Syncing completions to Local DB...")
    try:
        # Map user_id for local DB by matching public_profile_url
        local_engine = create_engine(LOCAL_URL)
        with Session(local_engine) as session:
            local_user_map = {
                u.public_profile_url: u.id
                for u in session.scalars(select(User)).all()
            }
        local_results = []
        neon_user_url = {u[0]: u[2] for u in users}
        for u_id, name, badges, err in results:
            prof_url = neon_user_url.get(u_id)
            loc_id = local_user_map.get(prof_url)
            if loc_id:
                local_results.append((loc_id, name, badges, err))
        sync_completions(LOCAL_URL, local_results, course_rows)
    except Exception as e:
        print("Error syncing to local DB:", e)

    print("ALL DONE!")
