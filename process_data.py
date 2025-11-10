# process_data.py
import os
import yaml
import json
import datetime
import re

DATA_DIR = 'ccf-deadlines-data/conference'
OUTPUT_FILE = 'conferences.json'

def parse_dates(date_str):
    """
    get conf info.
    example: "July 18-22, 2022", "June 25, 2025"
    """
    if not date_str:
        return None, None
    
    date_str_cleaned = date_str.replace(',', '')
    parts = date_str_cleaned.split()
    
    if len(parts) < 3:
        return None, None

    try:
        month = parts[0]
        year = parts[-1]
        
        if not re.match(r'^\d{4}$', year):
            year = parts[-2] 
            if not re.match(r'^\d{4}$', year):
                 return None, None 

        day_part = parts[1] # e.g., "18-22" or "18"
        
        day_nums = re.findall(r'\d+', day_part)
        
        if not day_nums:
            return None, None
            
        start_day = day_nums[0]
        end_day = day_nums[-1] 
        
        start_date_str = f"{month} {start_day} {year}"
        dt_start = datetime.datetime.strptime(start_date_str, '%B %d %Y')
        
        end_date_str = f"{month} {end_day} {year}"
        dt_end = datetime.datetime.strptime(end_date_str, '%B %d %Y')
        
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
