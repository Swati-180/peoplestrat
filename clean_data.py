import json
import random

path = r'd:\AntiGravity\PeopleStat\PeopleStat\mayamayaConsole.peopleData_QG (1).json'

with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Loaded {len(data)} records")

for record in data:
    # 1. Fix aptitude scores if null or missing
    if not record.get('aptitudeScores'):
        record['aptitudeScores'] = {
            "spiritScore": str(round(random.uniform(5, 9), 2)),
            "purposeScore": str(round(random.uniform(5, 9), 2)),
            "rewardsScore": str(round(random.uniform(5, 9), 2)),
            "professionScore": str(round(random.uniform(5, 9), 2))
        }
    else:
        # Fill missing sub-scores
        for key in ["spiritScore", "purposeScore", "rewardsScore", "professionScore"]:
            if not record['aptitudeScores'].get(key):
                record['aptitudeScores'][key] = str(round(random.uniform(5, 9), 2))

    # 2. Fix career profile if null
    if not record.get('careerProfile'):
        record['careerProfile'] = {
            "industries": [random.choice(["F&A", "PSS", "SAP", "Finance", "BPO", "IT"])],
            "roles": [random.choice(["Analyst", "Senior Specialist", "Team Lead", "Consultant"])],
            "skills": random.sample(["SAP FI", "Excel", "Reporting", "Communication", "Data Entry", "Verification"], 3)
        }

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print("Successfully updated JSON with realistic data.")
