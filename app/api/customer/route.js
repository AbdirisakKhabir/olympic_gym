import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const prisma = new PrismaClient();

async function uploadToCloudinary(file, resourceType = "auto") {
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    const { Readable } = require("stream");
    const stream = cloudinary.uploader.upload_stream(
      { folder: "libaax", resource_type: resourceType },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

// ✅ Robust date parser for DateTime fields
function parseDate(dateString) {
  if (!dateString) return null;

  // Handle different date formats
  let date;

  // If it's already in ISO format
  if (dateString.includes("T")) {
    date = new Date(dateString);
  } else {
    // If it's in YYYY-MM-DD format, add time component
    date = new Date(dateString + "T00:00:00.000Z");
  }

  // Validate
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateString}`);
  }

  return date;
}

export async function POST(req) {
  try {
    const formData = await req.formData();

    const name = formData.get("name");
    const phone = formData.get("phone"); // This can be null/empty
    const registerDate = formData.get("registerDate");
    const expireDate = formData.get("expireDate");
    const fee = formData.get("fee");
    const gender = formData.get("gender");
    const image = formData.get("image");
    const height = formData.get("height");
    const weight = formData.get("weight");
    const bmi = formData.get("bmi");
    const standardWeight = formData.get("standardWeight");
    const shift = formData.get("shift");
    const initialPaidAmount = formData.get("initialPaidAmount");
    const initialDiscount = formData.get("initialDiscount");
    const recordedByUserId = formData.get("recordedByUserId");

    // ✅ Validate required fields (phone is now optional)
    if (!name || !registerDate || !fee || !gender) {
      return new Response(
        JSON.stringify({ error: "All required fields must be filled" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let imageUrl = null;
    if (image && typeof image === "object") {
      imageUrl = await uploadToCloudinary(image, "image");
    }

    const registerDateObj = parseDate(registerDate);
    const expireDateObj = expireDate ? parseDate(expireDate) : null;
    const feeNumber = parseFloat(fee);
    const initialPaid = initialPaidAmount ? parseFloat(initialPaidAmount) : 0;
    const initialDisc = initialDiscount ? parseFloat(initialDiscount) : 0;
    const hasFirstPayment = initialPaid > 0 || initialDisc > 0;

    if (isNaN(feeNumber) || feeNumber < 0) {
      return new Response(
        JSON.stringify({ error: "Fee must be a valid non-negative number" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (isNaN(initialPaid) || initialPaid < 0 || isNaN(initialDisc) || initialDisc < 0) {
      return new Response(
        JSON.stringify({ error: "Initial paid amount and discount must be valid non-negative numbers" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const creatorUserId = recordedByUserId ? parseInt(recordedByUserId, 10) : NaN;
    if (hasFirstPayment && isNaN(creatorUserId)) {
      return new Response(
        JSON.stringify({ error: "User ID is required to record first payment" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const openingBalance = Math.max(0, feeNumber - initialPaid - initialDisc);

    // ✅ Prepare data for Prisma - set phone to null if empty
    const customerData = {
      name,
      phone: phone && phone.trim() !== "" ? phone : null, // Set to null if empty
      registerDate: registerDateObj,
      expireDate: expireDateObj,
      fee: feeNumber,
      gender,
      balance: openingBalance,
      image: imageUrl,
      isActive: true,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      bmi: bmi ? parseFloat(bmi) : null,
      standardWeight: standardWeight ? parseFloat(standardWeight) : null,
      shift: shift && shift.trim() !== "" ? shift.trim() : null,
    };

    // Create customer and optional first payment in one transaction
    const newCustomer = await prisma.$transaction(async (tx) => {
      const createdCustomer = await tx.customer.create({
        data: customerData,
      });

      if (hasFirstPayment) {
        await tx.payment.create({
          data: {
            customerId: createdCustomer.id,
            userId: creatorUserId,
            paidAmount: initialPaid,
            discount: initialDisc,
            balance: openingBalance,
            date: registerDateObj,
          },
        });
      }

      return createdCustomer;
    });

    return new Response(JSON.stringify(newCustomer), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error creating customer:", error);

    if (error.code === "P2002") {
      return new Response(
        JSON.stringify({ error: "Phone number already exists" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error.code === "P2003") {
      return new Response(
        JSON.stringify({ error: "Invalid user for first payment" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Customer creation failed",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const dynamic = "force-dynamic";
