# process_data.py
import os
import yaml
import json
import datetime
import re

DATA_DIR = 'ccf-deadlines-data/conference'
OUTPUT_FILE = 'conferences.json'

MONTH_MAP = {
    'Sept': 'Sep'
}

def _clean_month(month_str):
    month_str = month_str.replace('.', '') 
    return MONTH_MAP.get(month_str, month_str) 

def _parse_date_string(date_str_to_parse):
    try:
        return datetime.datetime.strptime(date_str_to_parse, '%B %d %Y')
    except ValueError:
        try:
            return datetime.datetime.strptime(date_str_to_parse, '%b %d %Y')
        except ValueError as e:
            raise e

def parse_dates(date_str):
    if not date_str:
        return None, None

    date_str_cleaned = date_str.replace(',', '').replace(' - ', '-')
    
    pattern = re.compile(
        r'([A-Za-z\.]+) (\d+(?:-\d+)?)'  
        r'(?:-([A-Za-z\.]+) (\d+))?'     
        r',? (\d{4})'                   
    )
    match = pattern.search(date_str_cleaned)
    
    if not match:
        print(f"Skipping (format not recognized): '{date_str}'")
        return None, None
    
    groups = match.groups()
    start_month_str = groups[0]
    day_range_str = groups[1]   # e.g., "18-22" or "29" or "25"
    end_month_str = groups[2]   # e.g., "Oct" or None
    end_day_str = groups[3]     # e.g., "6" or None
    year_str = groups[4]
    
    try:
        start_day_str = day_range_str.split('-')[0]
        
        if end_month_str and end_day_str:
            pass 
        else:
            end_month_str = start_month_str 
            if '-' in day_range_str:
                end_day_str = day_range_str.split('-')[-1] # "22"
            else:
                end_day_str = start_day_str # "25"
        
        start_month = _clean_month(start_month_str)
        dt_start = _parse_date_string(f"{start_month} {start_day_str} {year_str}")
        
        end_month = _clean_month(end_month_str)
        dt_end = _parse_date_string(f"{end_month} {end_day_str} {year_str}")
        
        return dt_start.isoformat(), dt_end.isoformat()

    except Exception as e:
        print(f"Error parsing date string: '{date_str}' -> {e}")
        return None, None

def process_conf_entry(entry_data, all_conferences):
    try:
        conf_title = entry_data.get('title', 'N/A')
        sub_field = entry_data.get('sub', 'N/A')
        rank_data = entry_data.get('rank', {})
        ccf_rank = 'N/A'
        if isinstance(rank_data, dict):
            ccf_rank = rank_data.get('ccf', 'N/A')
        
        if 'confs' in entry_data and entry_data['confs']:
            for conf_instance in entry_data['confs']:
                date_string = conf_instance.get('date')
                start_date_iso, end_date_iso = parse_dates(date_string)
                
                if start_date_iso and end_date_iso:
                    all_conferences.append({
                        'title': conf_title,
                        'sub': sub_field,
                        'ccfRank': ccf_rank,
                        'year': conf_instance.get('year', 'N/A'),
                        'link': conf_instance.get('link'),
                        'place': conf_instance.get('place'),
                        'dateString': date_string,
                        'startDate': start_date_iso,
                        'endDate': end_date_iso
                    })
    except Exception as e:
        print(f"Error processing entry {entry_data.get('title', 'N/A')}: {e}")

def main():
    all_conferences = []
    
    if not os.path.exists(DATA_DIR):
        print(f"Error: Data directory '{DATA_DIR}' not found.")
        return

    for subdir in os.listdir(DATA_DIR):
        subdir_path = os.path.join(DATA_DIR, subdir)
        if os.path.isdir(subdir_path):
            for filename in os.listdir(subdir_path):
                if filename.endswith('.yml'):
                    filepath = os.path.join(subdir_path, filename)
                    
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            data = yaml.safe_load(f)
                        
                        if isinstance(data, list):
                            for entry in data:
                                if isinstance(entry, dict):
                                    process_conf_entry(entry, all_conferences)
                        elif isinstance(data, dict):
                            process_conf_entry(data, all_conferences)
                            
                    except Exception as e:
                        print(f"Error processing file {filepath}: {e}")

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_conferences, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully processed {len(all_conferences)} conferences.")
    print(f"Data written to {OUTPUT_FILE}.")

if __name__ == "__main__":
    main()
