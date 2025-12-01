# Database Seeding Guide

This guide explains how to seed your Rynott ecommerce database with dummy data including categories, admin user, and products.

## Prerequisites

Make sure you have:

- MongoDB connection configured in `.env` file
- All dependencies installed (`npm install`)

## Seeding Scripts Available

### 1. Seed Categories

```bash
npm run seed:categories
```

Creates product categories that products can be assigned to.

### 2. Seed Admin User

```bash
npm run seed:admin
```

Creates a default admin user for product management.

**Admin Credentials:**

- Email: `admin@rynott.com`
- Password: `admin123`

### 3. Seed Products

```bash
npm run seed
```

Populates the database with 10 dummy products using the JSON data from `dummy-products.json`.

**Note:** This script will automatically create an admin user if it doesn't exist.

## Quick Start - Full Seeding

To seed everything at once, run these commands in order:

```bash
# 1. Seed categories
npm run seed:categories

# 2. Seed products (includes admin user creation)
npm run seed
```

## Dummy Products Included

The seeding script adds 10 realistic products across various categories:

1. **iPhone 15 Pro Max** - $1,199 (Smartphones)
2. **Samsung Galaxy S24 Ultra** - $1,299 (Smartphones)
3. **MacBook Pro 16-inch M3 Max** - $3,499 (Gaming Laptops)
4. **Dell XPS 15 9530** - $2,499 (Business Laptops)
5. **Sony WH-1000XM5 Wireless Headphones** - $399 (Wireless Headphones)
6. **Razer BlackShark V2 Gaming Headset** - $99.99 (Gaming Headphones)
7. **Nike Air Max 270** - $150 (Footwear)
8. **The Great Gatsby - Classic Edition** - $24.99 (Books)
9. **Herman Miller Aeron Chair** - $1,395 (Furniture)
10. **KitchenAid Stand Mixer** - $379 (Kitchen & Dining)

## Product Features

Each product includes:

- ✅ Detailed descriptions and specifications
- ✅ High-quality placeholder images from Unsplash
- ✅ Multiple variants (colors, sizes where applicable)
- ✅ Stock quantities and pricing
- ✅ Brand information and tags
- ✅ Category assignments
- ✅ Featured product flags
- ✅ Random ratings and review counts

## Categories Available

1. **Smartphones** - Latest smartphones and mobile devices
2. **Gaming Laptops** - High-performance laptops for gaming
3. **Business Laptops** - Professional laptops for business
4. **Wireless Headphones** - Premium wireless audio devices
5. **Gaming Headphones** - Gaming headsets for esports
6. **Footwear** - Shoes for all occasions
7. **Books** - Books and educational materials
8. **Furniture** - Office furniture and home decor
9. **Kitchen & Dining** - Kitchen appliances and dining essentials

## Database Statistics

After seeding, you should see:

- **10 Products** with total value of **$303,156.55**
- **9 Categories** across different product types
- **1 Admin User** for management access

## Accessing the Data

- **Products API**: `GET /api/products`
- **Categories API**: `GET /api/categories`
- **Admin Panel**: `http://localhost:5173/admin` (with admin login)

## Customization

To add more products:

1. Edit `dummy-products.json`
2. Run `npm run seed` again
3. Existing products will be cleared and replaced

To modify categories:

1. Edit `seed-categories.js`
2. Run `npm run seed:categories`
3. Existing categories will be cleared and replaced

## Troubleshooting

If you encounter issues:

1. **Connection Error**: Check your MongoDB URI in `.env`
2. **Category Not Found**: Ensure categories are seeded before products
3. **Duplicate Key Error**: Run the seeding scripts again to clear data
4. **Missing Admin User**: The product seeding script creates it automatically

## File Structure

```
ecommerce-server/
├── seed-categories.js          # Category seeding script
├── seed-admin-user.js          # Admin user seeding script
├── seed-dummy-products.js      # Product seeding script
├── dummy-products.json         # Product data source
└── SEEDING_GUIDE.md           # This guide
```
