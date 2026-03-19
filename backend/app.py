from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from flask import abort
import os
import json
import jwt
from collections import defaultdict
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta


app = Flask(__name__)
CORS(app)

JWT_SECRET = "supersecretkey"
JWT_ALGO = "HS256"
JWT_EXP_DELTA_SECONDS = 3600 * 24  # 1 day

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "images")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "ico"}
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

MONGO_URI = "mongodb+srv://shaheer_mongodb:soyal12345@cluster0.qhf6ili.mongodb.net/mydb?retryWrites=true&w=majority"
client = MongoClient(MONGO_URI)

# MONGO_URI = os.environ.get("MONGO_URI")
# client = MongoClient(MONGO_URI)
# db = client["ecommerce"]
# collection = db["products"] 
# orders_col = db["orders"]      
# users_collection = db["users"]

# MONGO_URI = os.environ.get("MONGO_URI")
# client = MongoClient(MONGO_URI)
db = client["ecommerce"]
collection = db["products"] 
orders_col = db["orders"]      
users_collection = db["users"]
profile_col = db["profile"]  # <-- Your existing profile collection

# MONGO_URI = os.environ.get("MONGO_URI") or "mongodb+srv://shaheer_mongodb:soyal12345@cluster0.qhf6ili.mongodb.net/mydb?retryWrites=true&w=majority"
# client = MongoClient(MONGO_URI)
# db = client["ecommerce"]
# collection = db["products"] 
# orders_col = db["orders"]      
# users_collection = db["users"]

ORDERS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "orders.json")

# Load orders from JSON into MongoDB
if os.path.exists(ORDERS_FILE):
    with open(ORDERS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        orders = data.get("orders", [])
        if orders:
            for order in orders:
                orders_col.update_one({"id": order["id"]}, {"$set": order}, upsert=True)

@app.route("/user-orders/<user_id>", methods=["GET"])
def get_user_orders(user_id):
    try:
        # ✅ Cancelled orders user ko dobara na dikhe
        orders = list(orders_col.find({
            "userId": user_id,
            "status": {
                "$nin": ["User Cancelled", "Cancelled"]
            }
        }))

        for order in orders:
            order["_id"] = str(order["_id"])

        return jsonify(orders)

    except Exception as e:
        print("User orders error:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/order-history/<user_id>")
def order_history(user_id):
    orders = list(db.orders.find({"userId": user_id}))

    for o in orders:
        o["_id"] = str(o["_id"])

    return jsonify(orders)

@app.route("/clear-history/<user_id>", methods=["DELETE"])
def clear_history(user_id):
    db.orders.delete_many({"userId": user_id})
    return jsonify({"message": "History cleared"})

@app.route("/remove-history/<order_id>", methods=["DELETE"])
def remove_history(order_id):
    db.orders.delete_one({"_id": ObjectId(order_id)})
    return jsonify({"message": "Removed"})

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def read_data():
    return collection.find_one({}, {"_id": 0}) or {}

# def write_data(new_data):
#     collection.update_one({}, {"$set": new_data})

def write_data(new_data):
    collection.update_one({}, {"$set": new_data}, upsert=True)

def get_list(data, key):
    return [item for item in data.get(key, []) if not item.get("deleted", False)]

def add_item(data, key, item):
    item["id"] = max([i.get("id",0) for i in data.get(key, [])]+[0]) + 1
    item["deleted"] = False
    item["createdAt"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    temp = data.get(key, [])
    temp.insert(0, item)
    data[key] = temp
    write_data(data)
    return item

def modify_item(data, key, item_id, new_data=None, delete=False):
    items = data.get(key, [])
    item = next((i for i in items if i["id"] == item_id), None)
    if not item:
        return None
    if delete:
        item["deleted"] = True
    elif new_data:
        item.update(new_data)
    data[key] = items
    write_data(data)
    return item
@app.route("/admin/owner-profile", methods=["GET", "POST"])
def owner_profile():
    try:
        BASE_URL = os.environ.get("BASE_URL", request.host_url.rstrip("/"))

        # -------- GET Profile --------
        if request.method == "GET":
            profile = profile_col.find_one({}, {"_id": 0})
            if not profile:
                return jsonify({"success": False, "profile": {}})
            # Ensure image has full URL
            if profile.get("image") and not profile["image"].startswith("http"):
                profile["image"] = f"{BASE_URL}{profile['image']}"
            return jsonify({"success": True, "profile": profile})

        # -------- POST / SAVE Profile --------
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)

        data = request.form.to_dict()
        file = request.files.get("image")

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            data["image"] = f"/images/{filename}"  # relative path stored

        # Add joined year if new profile
        if profile_col.count_documents({}) == 0:
            data["joined"] = datetime.utcnow().year

        # Ensure numeric types
        for field in ["age", "reviews", "rating"]:
            if field in data:
                try:
                    data[field] = int(data[field]) if field != "rating" else float(data[field])
                except:
                    data[field] = 0

        profile_col.update_one({}, {"$set": data}, upsert=True)

        # Return full URL for frontend
        if data.get("image") and not data["image"].startswith("http"):
            data["image"] = f"{BASE_URL}{data['image']}"

        return jsonify({"success": True, "profile": data})

    except Exception as e:
        print("Error in owner_profile:", e)
        return jsonify({"success": False, "error": str(e)}), 500


# ============================
# CANCEL ORDER (USER)
# ============================
@app.route("/cancel-order/<order_id>", methods=["POST"])
def cancel_order(order_id):
    try:
        data = request.json
        reason = data.get("reason", "No reason provided")

        if not ObjectId.is_valid(order_id):
            return jsonify({"success": False, "message": "Invalid order id"}), 400

        order = orders_col.find_one({"_id": ObjectId(order_id)})

        if not order:
            return jsonify({"success": False, "message": "Order not found"}), 404

        if order.get("status") == "Delivered":
            return jsonify({
                "success": False,
                "message": "Delivered order cannot be cancelled"
            })

        if order.get("status") in ["Cancelled", "User Cancelled"]:
            return jsonify({
                "success": False,
                "message": "Order already cancelled"
            })

        # ✅ SAVE REASON ALSO
        orders_col.update_one(
            {"_id": ObjectId(order_id)},
            {
                "$set": {
                    "status": "User Cancelled",
                    "cancelReason": reason,
                    "cancelledAt": datetime.utcnow()
                }
            }
        )

        return jsonify({
            "success": True,
            "message": "Order cancelled successfully"
        })

    except Exception as e:
        print("Cancel order error:", e)
        return jsonify({"success": False, "message": "Server error"}), 500
    
@app.route("/images/<path:filename>")
def images(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty file"}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(UPLOAD_FOLDER, filename))
        return jsonify({"filename": filename}), 201
    return jsonify({"error": "Invalid file"}), 400

@app.route("/preloader")
def preloader():
    """
    Returns preloader configuration for frontend from MongoDB
    """
    try:
        data = collection.find_one({"preloader": {"$exists": True}}, {"_id": 0, "preloader": 1})
        if not data:
            return jsonify({"error": "Preloader config not found"}), 404

        return jsonify(data["preloader"])

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Signup
# @app.route("/auth/signup", methods=["POST"])
# def signup():
#     data = request.json
#     # Save user to DB
#     return jsonify({"message": "User created"})

# Forgot password
@app.route("/auth/forgot-password", methods=["POST"])
def forgot_password():
    data = request.json
    return jsonify({"message": "Reset link sent"})

# Change password
@app.route("/auth/change-password", methods=["POST"])
def change_password():
    data = request.json
    email = data.get("email")
    new_password = data.get("newPassword")

    # Update password in DB
    return jsonify({"message": "Password updated"})

# @app.route("/auth/login", methods=["POST"])
# def login():
#     data = request.get_json()

#     email = data.get("email")
#     password = data.get("password")

#     user = db.users.find_one({"email": email})
#     if not user or not check_password_hash(user["password"], password):
#         return jsonify({"error": "Invalid credentials"}), 401

#     token = jwt.encode(
#         {"user_id": str(user["_id"]), "email": user["email"]},
#         JWT_SECRET,
#         algorithm=JWT_ALGO
#     )

#     return jsonify({
#         "token": token,
#         "user": {
#             "name": user["name"],
#             "email": user["email"]
#         }
#     })
# ==============================
# AUTH ROUTES (FINAL WORKING)
# ==============================


# ============================
# SIGNUP
# ============================
@app.route("/auth/signup", methods=["POST"])
def signup():
    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"error": "Missing fields"}), 400

    existing = users_collection.find_one({"email": email})
    if existing:
        return jsonify({"error": "User already exists"}), 400

    hashed_password = generate_password_hash(
        password,
        method="pbkdf2:sha256",
        salt_length=16
    )

    user = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "createdAt": datetime.utcnow()
    }

    result = users_collection.insert_one(user)

    return jsonify({
        "message": "User created",
        "userId": str(result.inserted_id)
    }), 201
# ----------------------------
# LOGIN
# ----------------------------
@app.route("/auth/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    user = users_collection.find_one({"email": email})

    if not user or not check_password_hash(user["password"], password):
        return jsonify({"message": "Invalid credentials"}), 401

    # convert ObjectId → string
    user["_id"] = str(user["_id"])

    # remove password before sending
    user.pop("password", None)

    token = jwt.encode(
        {
            "user_id": user["_id"],
            "email": user["email"],
            "exp": datetime.utcnow() + timedelta(seconds=JWT_EXP_DELTA_SECONDS),
        },
        JWT_SECRET,
        algorithm=JWT_ALGO,
    )

    return jsonify({
        "token": token,
        "user": user   # ⭐ FULL UPDATED USER RETURN
    })
# ================================
# REAL CONVERSION RATE API
# ================================
@app.route("/admin/dashboard/conversion")
def admin_conversion():

    data = read_data()
    orders = data.get("orders", [])
    users = data.get("users", [])

    total_orders = len([o for o in orders if o.get("status") == "Completed"])
    total_users = len(users)

    if total_users == 0:
        rate = 0
    else:
        rate = round((total_orders / total_users) * 100, 2)

    return jsonify({
        "totalUsers": total_users,
        "totalCompletedOrders": total_orders,
        "conversionRate": rate
    })

@app.route("/admin/dashboard/stats")
def admin_dashboard_stats():
    total_customers = db.users.count_documents({})

    today = datetime.utcnow().replace(hour=0, minute=0, second=0)
    new_today = db.users.count_documents({
        "createdAt": {"$gte": today}
    })

    last_7_days = datetime.utcnow() - timedelta(days=7)
    new_week = db.users.count_documents({
        "createdAt": {"$gte": last_7_days}
    })

    total_orders = orders_col.count_documents({})
    total_revenue = sum(
        o.get("total", 0) for o in orders_col.find()
    )

    return jsonify({
        "totalCustomers": total_customers,
        "newCustomersToday": new_today,
        "newCustomersWeek": new_week,
        "totalOrders": total_orders,
        "totalRevenue": total_revenue
    })

@app.route("/admin/customers")
def admin_customers():
    users = list(db.users.find({}, {"password": 0}))
    for u in users:
        u["_id"] = str(u["_id"])
    return jsonify(users)

@app.route("/user/<user_id>", methods=["GET"])
def get_user(user_id):
    user = users_collection.find_one({"_id": ObjectId(user_id)}, {"password": 0})
    if not user:
        return jsonify({"message": "User not found"}), 404

    user["_id"] = str(user["_id"])
    return jsonify(user)

@app.route("/user/<user_id>", methods=["PUT"])
def update_user(user_id):
    update_data = request.json
    if "password" in update_data:
        update_data["password"] = generate_password_hash(update_data["password"], method="pbkdf2:sha256", salt_length=16)

    users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    user = users_collection.find_one({"_id": ObjectId(user_id)}, {"password": 0})
    user["_id"] = str(user["_id"])
    return jsonify({"success": True, "user": user})

# ================= UPDATE USER PROFILE =================
@app.route("/update-profile/<user_id>", methods=["PUT"])
def update_profile(user_id):
    data = request.json

    update_data = {
        "firstName": data.get("firstName"),
        "lastName": data.get("lastName"),
        "email": data.get("email"),
        "phone": data.get("phone"),
        "street": data.get("street"),
        "city": data.get("city"),
        "state": data.get("state"),
        "pincode": data.get("pincode"),
        "image": data.get("image"),
    }

    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )

    updated_user = db.users.find_one({"_id": ObjectId(user_id)})
    updated_user["_id"] = str(updated_user["_id"])

    return jsonify(updated_user)

@app.route("/")
def home():
    return "Backend is Running Successfully 🚀"

@app.route("/banner")
def banners():
    data = read_data()
    return jsonify(get_list(data, "banners"))



@app.route("/brands")
def brands():
    data = read_data()
    return jsonify(get_list(data, "brands"))


@app.route("/admin/brands", methods=["GET", "POST"])
def admin_brands():
    data = read_data()

    if "brands" not in data:
        data["brands"] = []

    if request.method == "GET":
        return jsonify(get_list(data, "brands"))

    # ===== POST : ADD BRAND =====
    item = request.form.to_dict()

    if not item.get("name"):
        return jsonify({"success": False, "error": "Brand name required"}), 400

    file = request.files.get("imageFile")
    BASE_URL = os.environ.get("BASE_URL", request.host_url.rstrip("/"))

    # ✅ If file uploaded
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(UPLOAD_FOLDER, filename))
        item["image"] = f"{BASE_URL}/images/{filename}"

    # ✅ If no file but image URL provided from frontend
    elif item.get("image"):
        item["image"] = item["image"]

    # ✅ Brand external URL (coming from frontend input)
    if item.get("url"):
        item["url"] = item["url"]

    item["id"] = max([b.get("id", 0) for b in data["brands"]] + [0]) + 1
    item["deleted"] = False
    item["createdAt"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    data["brands"].insert(0, item)
    write_data(data)

    return jsonify({"success": True, "brand": item})


@app.route("/admin/brands/<int:id>", methods=["PUT", "DELETE"])
def admin_brands_modify(id):
    data = read_data()

    if request.method == "DELETE":
        item = modify_item(data, "brands", id, delete=True)
        write_data(data)
        return jsonify({"success": True if item else False})

    # ===== PUT : EDIT BRAND =====
    update_data = request.form.to_dict()

    file = request.files.get("imageFile")
    BASE_URL = os.environ.get("BASE_URL", request.host_url.rstrip("/"))

    # ✅ If new image uploaded
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(UPLOAD_FOLDER, filename))
        update_data["image"] = f"{BASE_URL}/images/{filename}"

    # ✅ If editing image via URL
    elif update_data.get("image"):
        update_data["image"] = update_data["image"]

    # ✅ Update brand external URL
    if update_data.get("url"):
        update_data["url"] = update_data["url"]

    item = modify_item(data, "brands", id, new_data=update_data)
    write_data(data)

    return jsonify({"success": True if item else False})
  

@app.route("/products")
def products():
    data = read_data()
    active_products = get_list(data, "products")
    active_products.sort(key=lambda x: x.get("id",0), reverse=True)
    return jsonify(active_products)

@app.route("/latestProducts")
def latest_products():
    data = read_data()
    latest = get_list(data, "LatestProducts")
    latest.sort(key=lambda x: x.get("id",0), reverse=True)
    return jsonify(latest)

@app.route("/admin/latest-products", methods=["GET"])
def admin_get_latest_products():
    data = read_data()
    return jsonify(data.get("LatestProducts", []))

@app.route("/admin/latest-products", methods=["POST"])
def admin_add_latest_product():
    data = read_data()
    products = data.get("LatestProducts", [])

    product = request.form.to_dict()

    file = request.files.get("imageFile")
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(UPLOAD_FOLDER, filename))
        product["image"] = f"http://127.0.0.1:5000/images/{filename}"

    product["id"] = max([p.get("id", 0) for p in products] + [0]) + 1
    product["deleted"] = False
    product["createdAt"] = datetime.now().isoformat()

    products.insert(0, product)
    data["LatestProducts"] = products
    collection.update_one({}, {"$set": data}, upsert=True)

    return jsonify({"success": True})


@app.route("/admin/latest-products/<int:id>", methods=["PUT"])
def admin_update_latest_product(id):
    data = read_data()
    products = data.get("LatestProducts", [])

    product = next((p for p in products if p["id"] == id), None)
    if not product:
        return jsonify({"error": "Not found"}), 404

    update_data = request.form.to_dict()

    file = request.files.get("imageFile")
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(UPLOAD_FOLDER, filename))
        update_data["image"] = f"http://127.0.0.1:5000/images/{filename}"

    product.update(update_data)
    collection.update_one({}, {"$set": data}, upsert=True)

    return jsonify({"success": True})

@app.route("/admin/latest-products/<int:id>", methods=["DELETE"])
def admin_delete_latest_product(id):
    data = read_data()
    products = data.get("LatestProducts", [])

    product = next((p for p in products if p["id"] == id), None)
    if not product:
        return jsonify({"error": "Not found"}), 404

    product["deleted"] = True
    collection.update_one({}, {"$set": data}, upsert=True)

    return jsonify({"success": True})

@app.route("/admin/latest-products/<int:id>/recover", methods=["POST"])
def admin_recover_latest_product(id):
    data = read_data()
    products = data.get("LatestProducts", [])

    product = next((p for p in products if p["id"] == id), None)
    if not product:
        return jsonify({"error": "Not found"}), 404

    product["deleted"] = False
    collection.update_one({}, {"$set": data}, upsert=True)

    return jsonify({"success": True})


@app.route("/admin/latest-products/<int:id>/permanent", methods=["DELETE"])
def admin_permanent_delete_latest_product(id):
    data = read_data()
    products = data.get("LatestProducts", [])

    data["LatestProducts"] = [p for p in products if p["id"] != id]
    collection.update_one({}, {"$set": data}, upsert=True)

    return jsonify({"success": True})




@app.route("/categories")
def categories():
    data = read_data()
    return jsonify(get_list(data, "categories"))


# ============================
# ELECTRONICS (PUBLIC)
# ============================
@app.route("/electronics")
def electronics():
    data = read_data()
    electronics = [e for e in data.get("electronics", []) if not e.get("deleted", False)]
    electronics.sort(key=lambda x: x.get("id", 0), reverse=True)
    return jsonify(electronics)


# ============================
# ADMIN ELECTRONICS
# ============================
@app.route("/admin/electronics", methods=["GET", "POST"])
def admin_electronics():
    data = read_data()
    data.setdefault("electronics", [])

    # ---------- GET ----------
    if request.method == "GET":
        return jsonify(data["electronics"])

    # ---------- POST ----------
    if request.is_json:
        item = request.get_json()
    else:
        item = request.form.to_dict()

    # BASIC
    item["id"] = max([i.get("id", 0) for i in data["electronics"]] + [0]) + 1
    item["deleted"] = False
    item["createdAt"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # EXTRA DETAILS
    item["brand"] = item.get("brand", "")
    item["model"] = item.get("model", "")
    item["material"] = item.get("material", "")
    item["warranty"] = item.get("warranty", "")
    item["quantity"] = int(item.get("quantity", 1))

    item["colors"] = item.get("colors", [])
    item["sizes"] = item.get("sizes", [])
    item["highlights"] = item.get("highlights", [])

    item["specifications"] = item.get("specifications", {})

    if "images" not in item:
        item["images"] = []

    # NUMBERS
    for f in ["price", "oldPrice", "stock", "rating", "reviews"]:
        if f in item and item[f] != "":
            item[f] = float(item[f]) if "." in str(item[f]) else int(item[f])

    data["electronics"].insert(0, item)
    write_data(data)
    return jsonify(item)


# ============================
# UPDATE / DELETE
# ============================
@app.route("/admin/electronics/<int:id>", methods=["PUT", "DELETE"])
def admin_electronics_modify(id):
    data = read_data()
    item = next((e for e in data.get("electronics", []) if e["id"] == id), None)
    if not item:
        return jsonify({"error": "Not found"}), 404

    if request.method == "DELETE":
        item["deleted"] = True
        write_data(data)
        return jsonify({"success": True})

    # PUT
    update_data = request.get_json() if request.is_json else request.form.to_dict()

    item.update(update_data)

    write_data(data)
    return jsonify({"success": True})


# ============================
# RECOVER
# ============================
@app.route("/admin/electronics/<int:id>/recover", methods=["POST"])
def recover_electronics(id):
    data = read_data()
    item = next((e for e in data.get("electronics", []) if e["id"] == id), None)
    if not item:
        return jsonify({"error": "Not found"}), 404
    item["deleted"] = False
    write_data(data)
    return jsonify({"success": True})


# ============================
# PERMANENT DELETE
# ============================
@app.route("/admin/electronics/<int:id>/permanent", methods=["DELETE"])
def permanent_delete_electronics(id):
    data = read_data()
    data["electronics"] = [e for e in data.get("electronics", []) if e["id"] != id]
    write_data(data)
    return jsonify({"success": True})


@app.route("/features")
def features():
    data = read_data()
    return jsonify(get_list(data, "features"))

@app.route("/promo")
def promo():
    data = read_data()
    return jsonify(get_list(data, "promo"))
# ============================
# BANNERS TWO CRUD (inside products collection)
# ============================

def get_banners_two_list():
    data = read_data()
    return [b for b in data.get("bannersTwo", []) if not b.get("deleted", False)]

@app.route("/banners-two", methods=["GET"])
def get_banners_two():
    return jsonify(get_banners_two_list())


@app.route("/banners-two", methods=["POST"])
def add_banner_two():
    banner = request.json
    if not banner.get("image"):
        return jsonify({"success": False, "message": "Image required"}), 400

    # Initialize if not exists
    data = read_data()
    if "bannersTwo" not in data:
        data["bannersTwo"] = []

    banner["id"] = max([b.get("id",0) for b in data["bannersTwo"]] + [0]) + 1
    banner["deleted"] = False
    banner["createdAt"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Insert at beginning
    data["bannersTwo"].insert(0, banner)
    write_data(data)

    return jsonify({"success": True, "banner": banner})


@app.route("/banners-two/<int:id>", methods=["PUT"])
def update_banner_two(id):
    data = read_data()
    banners = data.get("bannersTwo", [])
    banner = next((b for b in banners if b["id"] == id), None)
    if not banner:
        return jsonify({"success": False, "message": "Banner not found"}), 404

    update_data = request.json
    banner.update(update_data)
    data["bannersTwo"] = banners
    write_data(data)

    return jsonify({"success": True, "banner": banner})


@app.route("/banners-two/<int:id>", methods=["DELETE"])
def delete_banner_two(id):
    data = read_data()
    banners = data.get("bannersTwo", [])
    banner = next((b for b in banners if b["id"] == id), None)
    if not banner:
        return jsonify({"success": False, "message": "Banner not found"}), 404

    banner["deleted"] = True
    data["bannersTwo"] = banners
    write_data(data)

    return jsonify({"success": True, "banner": banner})


@app.route("/site-config")
def site_config():
    data = read_data()
    return jsonify(data.get("site", {}))

@app.route("/navbar")
def navbar():
    data = read_data()
    return jsonify(data.get("navbar", {}))

@app.route("/footer")
def get_footer():
    data = read_data()
    return jsonify(data.get("footer", {}))

# PUT footer
@app.route("/admin/footer", methods=["PUT"])
def admin_footer():
    footer_data = request.get_json()
    data = read_data()
    if "footer" not in data:
        data["footer"] = {}
    data["footer"].update(footer_data)
    write_data(data)
    return jsonify({"success": True})

# ============================
# PLACE ORDER
# ============================
# ==================================
# PLACE ORDER (FINAL WORKING VERSION)
# ==================================
@app.route("/orders", methods=["POST"])
def place_order():
    try:
        data = request.get_json()

        user_id = data.get("userId")
        customer = data.get("customer")
        items = data.get("items", [])
        total = data.get("total")

        if not user_id or not items:
            return jsonify({
                "success": False,
                "message": "Invalid order data"
            }), 400

        processed_items = []

        # ✅ FIX OFFER + DISCOUNT SAVE
        for item in items:

            offer_text = item.get("offer", "")

            # extract percentage automatically
            offer_percentage = item.get("offerPercentage", 0)

            if (not offer_percentage) and "%" in str(offer_text):
                try:
                    offer_percentage = int(
                        offer_text.split("%")[0]
                    )
                except:
                    offer_percentage = 0

            price = float(item.get("price", 0))
            qty = int(item.get("quantity", 1))

            discount = round(
                (price * offer_percentage) / 100,
                2
            )

            processed_items.append({
                "id": item.get("id"),
                "name": item.get("name"),
                "image": item.get("image"),
                "price": price,
                "quantity": qty,

                # ✅ IMPORTANT FIELDS
                "offer": offer_text,
                "offerPercentage": offer_percentage,
                "discount": discount
            })

        order = {
            "userId": user_id,
            "customer": customer,
            "items": processed_items,
            "total": total,
            "status": "Pending",
            "createdAt": datetime.utcnow()
        }

        result = orders_col.insert_one(order)

        order["_id"] = str(result.inserted_id)

        return jsonify({
            "success": True,
            "order": order
        }), 201

    except Exception as e:
        print("ORDER ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Failed to place order"
        }), 500



# GET all orders (newest first)
# ----------------------------
# GET USER ORDERS
# ----------------------------
# ================================
# ORDERS API
# ================================

# Get all orders (Admin dashboard)
@app.route("/orders", methods=["GET"])
def get_all_orders():

    orders = list(orders_col.find().sort("createdAt", -1))

    for order in orders:
        order["_id"] = str(order["_id"])

    return jsonify(orders)


# Get orders by user
@app.route("/orders/<user_id>", methods=["GET"])
def get_orders_by_user(user_id):

    user_orders = list(orders_col.find({"userId": user_id}))

    for order in user_orders:
        order["_id"] = str(order["_id"])

    return jsonify(user_orders)


# Create order
# @app.route("/orders", methods=["POST"])
# def create_order():

#     data = request.json

#     order = {
#         "userId": data.get("userId"),
#         "items": data.get("items", []),
#         "total": data.get("total", 0),
#         "status": "Pending",
#         "createdAt": datetime.utcnow()
#     }

#     result = orders_col.insert_one(order)

#     order["_id"] = str(result.inserted_id)

#     return jsonify({
#         "message": "Order created",
#         "order": order
#     }), 201

# PUT update order status
@app.route("/orders/<order_id>/status", methods=["PUT"])
def update_order_status(order_id):
    status = request.json.get("status")
    result = orders_col.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": status}}
    )
    if result.modified_count:
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Order not found"})

@app.route("/orders/<order_id>", methods=["DELETE"])
def delete_order(order_id):
    if not ObjectId.is_valid(order_id):
        return jsonify({"success": False, "error": "Invalid ID"}), 400

    result = orders_col.delete_one({"_id": ObjectId(order_id)})
    if result.deleted_count == 1:
        return jsonify({"success": True})

    return jsonify({"success": False, "error": "Order not found"}), 404



@app.route("/admin/sidebar")
def admin_sidebar():
    data = read_data()
    return jsonify(data.get("admin", {}).get("sidebar", {"title":"Admin Panel","menus":[] }))

@app.route("/admin/topbar")
def admin_topbar():
    data = read_data()
    return jsonify(data.get("admin", {}).get("topbar", {"title":"Welcome Admin"}))

@app.route("/admin/navbar/menu", methods=["GET", "POST"])
def admin_navbar_menu():
    data = read_data()

    if "navbar" not in data:
        data["navbar"] = {"menu": []}

    menu = data["navbar"].get("menu", [])

    if request.method == "GET":
        return jsonify(menu)

    new_menu = request.get_json()
    new_menu["id"] = max([m.get("id", 0) for m in menu] + [0]) + 1
    new_menu["deleted"] = False
    new_menu["createdAt"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    menu.insert(0, new_menu)
    data["navbar"]["menu"] = menu
    write_data(data)

    return jsonify({"success": True})

@app.route("/admin/navbar/menu/<int:menu_id>", methods=["DELETE", "POST"])
def admin_navbar_menu_modify(menu_id):
    data = read_data()
    menu = data.get("navbar", {}).get("menu", [])

    item = next((m for m in menu if m["id"] == menu_id), None)
    if not item:
        return jsonify({"error": "Not found"}), 404

    if request.method == "DELETE":
        if request.args.get("permanent") == "true":
            data["navbar"]["menu"] = [m for m in menu if m["id"] != menu_id]
        else:
            item["deleted"] = True

    if request.method == "POST":
        item["deleted"] = False

    write_data(data)
    return jsonify({"success": True})

@app.route("/admin/navbar/config", methods=["GET", "PUT"])
def admin_navbar_config():
    data = read_data()

    if "navbar" not in data:
        data["navbar"] = {}

    if request.method == "GET":
        return jsonify(data["navbar"])

    config = request.get_json()
    data["navbar"].update(config)
    write_data(data)
    return jsonify({"success": True})

@app.route("/admin/<string:key>", methods=["GET","POST"])
def admin_get_post(key):
    key_map = {
        "banners":"banners",
        "products":"products",
        # "latest-products":"LatestProducts",
        "categories":"categories",
        "features":"features",
        "promo":"promo"
    }
    if key not in key_map:
        return jsonify({"error":"Invalid key"}), 400
    data = read_data()
    col_key = key_map[key]
    if request.method=="GET":
        return jsonify(get_list(data,col_key))
    item = request.get_json()
    added = add_item(data,col_key,item)
    return jsonify({"success": True, col_key: added})
@app.route("/admin/<string:key>/<int:item_id>", methods=["PUT","DELETE"])
def admin_put_delete(key, item_id):
    key_map = {
        "banners":"banners",
        "products":"products",
        # "latest-products":"LatestProducts",
        "categories":"categories",
        "features":"features",
        "promo":"promo"
    }

    if key not in key_map:
        return jsonify({"error":"Invalid key"}), 400

    data = read_data()
    col_key = key_map[key]

    if request.method == "DELETE":
        items = data.get(col_key, [])
        new_items = [i for i in items if i["id"] != item_id]
        if len(items) == len(new_items):
            return jsonify({"error":"Item not found"}), 404 
        data[col_key] = new_items
        write_data(data)
        return jsonify({"success": True})

    item = modify_item(data, col_key, item_id, request.get_json())
    if not item:
        return jsonify({"error":"Not found"}), 404

    return jsonify({"success": True})

if __name__ == "__main__":
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.run(debug=True)

