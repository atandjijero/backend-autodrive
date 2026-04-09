import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function migrateVehiclePhotos() {
  const prisma = new PrismaClient();

  // Initialize Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    // Get all vehicles with photos
    const vehicles = await prisma.vehicle.findMany({
      where: {
        photos: {
          isEmpty: false
        }
      }
    });

    console.log(`Found ${vehicles.length} vehicles with photos`);

    for (const vehicle of vehicles) {
      const newPhotos: string[] = [];

      for (const photoUrl of vehicle.photos) {
        // Check if it's a local URL
        if (photoUrl.includes('localhost:9000/uploads/vehicles/') || photoUrl.includes('http://localhost:9000/uploads/vehicles/')) {
          try {
            console.log(`Migrating photo for vehicle ${vehicle.id}: ${photoUrl}`);

            // Download the image
            const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            // Upload to Cloudinary
            const result = await new Promise<any>((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                {
                  folder: 'vehicles',
                  resource_type: 'image',
                  transformation: [
                    { width: 1200, height: 800, crop: 'limit' },
                    { quality: 'auto' },
                  ],
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              uploadStream.end(buffer);
            });

            newPhotos.push(result.secure_url);
            console.log(`Migrated to: ${result.secure_url}`);
          } catch (error) {
            console.error(`Failed to migrate ${photoUrl}:`, error instanceof Error ? error.message : String(error));
            // Keep the original URL if migration fails
            newPhotos.push(photoUrl);
          }
        } else {
          // Already a Cloudinary URL or other
          newPhotos.push(photoUrl);
        }
      }

      // Update the vehicle
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { photos: newPhotos }
      });

      console.log(`Updated vehicle ${vehicle.id}`);
    }

    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error instanceof Error ? error.message : String(error));
  } finally {
    await prisma.$disconnect();
  }
}

migrateVehiclePhotos();