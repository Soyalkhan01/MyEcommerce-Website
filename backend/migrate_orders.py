from pymongo import MongoClient
from dotenv import load_dotenv
import json
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI)

db = client["ecommerce"]
orders_col = db["orders"]

ORDERS_FILE = os.path.join(os.path.dirname(
    os.path.abspath(__file__)), "orders.json")

if os.path.exists(ORDERS_FILE):
    with open(ORDERS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        orders = data.get("orders", [])

        if orders:
            for order in orders:
                orders_col.update_one(
                    {"id": order["id"]},
                    {"$set": order},
                    upsert=True,
                )

print("Orders migrated successfully.")
