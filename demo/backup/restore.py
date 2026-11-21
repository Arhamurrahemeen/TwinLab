# Restore the 3 test devices parked for the demo recording: .venv\Scripts\python demo\backup\restore.py
from pymongo import MongoClient
from bson import json_util
db = MongoClient('mongodb://admin:twinlab123@localhost:27017')['twinlab']
d = json_util.loads(open(__file__.replace("restore.py", "parked_devices.json")).read())
for doc in d["devices"]:
    doc["status"] = "active"
    db.devices.replace_one({"device_id": doc["device_id"]}, doc, upsert=True)
print("[OK] restored", [x["device_id"] for x in d["devices"]])
