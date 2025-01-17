import { NextResponse } from "next/server";
import { RekognitionClient, CompareFacesCommand } from "@aws-sdk/client-rekognition";

export async function POST(req) {
    console.log("hit request");
    try {
        const { webcamImage, uid } = await req.json();
        const rawBase64 = webcamImage.replace(/^data:image\/\w+;base64,/, '');
        // Create an instance of the Rekognition client
        const rekognitionClient = new RekognitionClient({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
            },
        });

        // Specify the parameters for the CompareFaces command
        const compareFacesParams = {
            SourceImage: {
                Bytes: Buffer.from(rawBase64, "base64"), // Convert the webcam image to bytes
            },
            TargetImage: {
                S3Object: {
                    Bucket: process.env.S3_BUCKET_NMAE, // Your S3 bucket name
                    Name: `${process.env.S3_FACEDATA_FOLDER}/${uid}.png`, // The target image name in S3 based on uid
                },
            },
            SimilarityThreshold: 70, // Adjust the similarity threshold as per your requirement
        };

        // Call the CompareFaces command
        const compareFacesCommand = new CompareFacesCommand(compareFacesParams);
        const compareFacesResponse = await rekognitionClient.send(compareFacesCommand);

        // Get the similarity percentage from the response
        const similarityPercentage = compareFacesResponse.FaceMatches[0]?.Similarity || 0;
        console.log(similarityPercentage + " :: <<<");

        // Send the similarity percentage as a response
        return NextResponse.json({
            success: true,
            similarityPercentage,
        });

    } catch (error) {
        console.log("error", error);
        return NextResponse.json({
            error: "Error comparing faces: " + error.message,
        });
    }
}
