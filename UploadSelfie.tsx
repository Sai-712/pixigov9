import React, { useState, useEffect } from 'react';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { S3_BUCKET_NAME, s3Client, rekognitionClient } from '../config/aws';
import { CompareFacesCommand } from '@aws-sdk/client-rekognition';
import { Camera, X, Download, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { colors } from '../config/theme';

const UploadSelfie = () => {
    const navigate = useNavigate();
    const [selfie, setSelfie] = useState<File | null>(null);
    const [matchedImages, setMatchedImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<string>('');

    useEffect(() => {
        // Initialize component and handle direct access
        const initializeComponent = async () => {
            try {
                // Get eventId from URL path or search params
                const pathSegments = window.location.pathname.split('/');
                const uploadSelfieIndex = pathSegments.findIndex(segment => segment === 'upload-selfie');
                let urlEventId = uploadSelfieIndex !== -1 ? pathSegments[uploadSelfieIndex + 1] : null;
                
                // If not in path, check URL search params
                if (!urlEventId) {
                    const searchParams = new URLSearchParams(window.location.search);
                    urlEventId = searchParams.get('eventId');
                }

                // Check local storage as fallback
                if (!urlEventId) {
                    urlEventId = localStorage.getItem('currentEventId');
                }
                
                if (!urlEventId) {
                    throw new Error('Event ID is missing. Please ensure you have a valid event link.');
                }
                
                // Validate eventId format (UUID format)
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!uuidRegex.test(urlEventId)) {
                    throw new Error('Invalid event ID format. Please check your event link.');
                }
                
                // Set the event ID in state and storage
                setSelectedEvent(urlEventId);
                localStorage.setItem('currentEventId', urlEventId);
                setIsInitialized(true);

                // Store user info if available
                const userEmail = localStorage.getItem('userEmail');
                const userName = localStorage.getItem('userName');
                if (!userEmail && !userName) {
                    throw new Error('Please log in to access this event.');
                }
            } catch (error: any) {
                setUploadError(error.message);
                console.error('Initialization error:', error);
                navigate('/events');
            }
        };
        initializeComponent();
    }, [navigate]);

    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-champagne">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-turquoise mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    const validateImage = (file: File) => {
        // Check file type
        if (!file.type.match(/^image\/(jpeg|png)$/)) {
            throw new Error('Only JPEG and PNG images are supported');
        }

        // Check file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Image size must be less than 5MB');
        }
        return true;
    };

    const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                validateImage(file);
                setSelfie(file);
                setPreviewUrl(URL.createObjectURL(file));
                setUploadError(null);
            } catch (error: any) {
                setUploadError(error.message);
            }
        }
    };

    const compareFaces = async (selfieUrl: string) => {
        try {
            const userEmail = localStorage.getItem('userEmail');
            const userName = localStorage.getItem('userName');
            const userRole = localStorage.getItem('userRole') || 'user';
            
            if (!userEmail && !userName) {
                throw new Error('User authentication required. Please log in to compare faces.');
            }
            
            const userIdentifier = userEmail || userName || '';
            const userFolder = userIdentifier.replace(/[^a-zA-Z0-9]/g, '_');
            const selfiePath = `${userRole}/${userFolder}/selfies/${selfieUrl}`;
            
            // Get event ID from URL
            const pathSegments = window.location.pathname.split('/');
            const urlEventId = pathSegments[pathSegments.length - 1];
            if (!urlEventId) {
                throw new Error('Event ID is required for uploading a selfie.');
            }
            setSelectedEvent(urlEventId);
            
            const listCommand = new ListObjectsV2Command({
                Bucket: S3_BUCKET_NAME,
                Prefix: `events/${userEmail}/${urlEventId}/images/`,
            });
    
            const listResponse = await s3Client.send(listCommand);
            if (!listResponse.Contents || listResponse.Contents.length === 0) {
                throw new Error('No images found in your uploads directory. Please upload some images first.');
            }
    
            const uploadKeys = listResponse.Contents
                .map(item => item.Key)
                .filter(key => key && 
                    /\.(jpg|jpeg|png)$/i.test(key));
            
            if (uploadKeys.length === 0) {
                throw new Error('No valid images found to compare with. Please upload some images first.');
            }

            const BATCH_SIZE = 5;
            const matchedUrls: Array<{ url: string; similarity: number }> = [];
            let processedImages = 0;
            const totalImages = uploadKeys.length;
            setUploadError(null);
    
            for (let i = 0; i < uploadKeys.length; i += BATCH_SIZE) {
                const batch = uploadKeys.slice(i, Math.min(i + BATCH_SIZE, uploadKeys.length));
                const batchPromises = batch.map(async (key) => {
                    try {
                        console.log(`Processing image ${processedImages + 1}/${totalImages}: ${key}`);
                        const compareCommand = new CompareFacesCommand({
                            SourceImage: {
                                S3Object: {
                                    Bucket: S3_BUCKET_NAME,
                                    Name: selfiePath,
                                },
                            },
                            TargetImage: {
                                S3Object: {
                                    Bucket: S3_BUCKET_NAME,
                                    Name: key,
                                },
                            },
                            SimilarityThreshold: 90,
                        });
        
                        const compareResponse = await rekognitionClient.send(compareCommand);
                        if (compareResponse.FaceMatches && compareResponse.FaceMatches.length > 0) {
                            const bestMatch = compareResponse.FaceMatches.reduce((prev, current) => {
                                return (prev.Similarity || 0) > (current.Similarity || 0) ? prev : current;
                            });
        
                            return {
                                url: `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${key}`,
                                similarity: bestMatch.Similarity || 0
                            };
                        }
                        return null;
                    } catch (error: any) {
                        console.error(`Error comparing face with ${key}:`, error);
                        return null;
                    }
                });

                const batchResults = await Promise.all(batchPromises);
                processedImages += batch.length;

                const validResults = batchResults.filter((result): result is { url: string; similarity: number } => 
                    result !== null && result.similarity >= 90
                );
                matchedUrls.push(...validResults);

                // Update progress
                const progress = Math.round((processedImages / totalImages) * 100);
                console.log(`Face comparison progress: ${progress}%`);
            }
    
            const sortedMatches = matchedUrls.sort((a, b) => b.similarity - a.similarity);
            
            if (sortedMatches.length === 0) {
                throw new Error('No matching faces found in your uploaded images.');
            }

            return {
                matchedUrls: sortedMatches.map(match => match.url),
                message: `Found ${sortedMatches.length} matches out of ${totalImages} images processed.`
            };
        } catch (error: any) {
            console.error('Error in face comparison process:', error);
            throw error;
        }
    };

    const clearSelfie = () => {
        setSelfie(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
    };

    const handleUpload = async () => {
        if (!selfie) {
            setUploadError('Please select a selfie image first.');
            return;
        }

        setIsUploading(true);
        setUploadError(null);
        setMatchedImages([]);

        try {
            // Upload selfie to S3
            const fileName = `selfie-${Date.now()}-${selfie.name}`;
            await uploadToS3(selfie, fileName);

            // Compare faces
            const result = await compareFaces(fileName);
            if (result.matchedUrls && result.matchedUrls.length > 0) {
                setMatchedImages(result.matchedUrls);
            } else {
                setUploadError('No matching faces found in your uploaded images.');
            }

            if (result.message) {
                console.log(result.message);
            }
        } catch (error: any) {
            console.error('Error during upload process:', error);
            setUploadError(error.message || 'Error uploading selfie. Please try again.');
            setMatchedImages([]);
        } finally {
            setIsUploading(false);
        }
    };

    const uploadToS3 = async (file: File, fileName: string) => {
        try {
            const userEmail = localStorage.getItem('userEmail');
            const userName = localStorage.getItem('userName');
            const userRole = localStorage.getItem('userRole') || 'user';
            
            if (!userEmail && !userName) {
                throw new Error('User authentication required. Please log in to upload selfies.');
            }
            
            const userIdentifier = userEmail || userName || '';
            const userFolder = userIdentifier.replace(/[^a-zA-Z0-9]/g, '_');
    
            const uploadParams = {
                Bucket: S3_BUCKET_NAME,
                Key: `${userRole}/${userFolder}/selfies/${fileName}`,
                Body: file,
                ContentType: file.type,
            };
    
            const uploadInstance = new Upload({
                client: s3Client,
                params: uploadParams,
                partSize: 5 * 1024 * 1024,
                leavePartsOnError: false,
            });
    
            await uploadInstance.done();
            return fileName;
        } catch (error) {
            console.error('Error uploading to S3:', error);
            throw new Error('Failed to upload selfie. Please try again.');
        }
    };

    const handleDownload = async (url: string) => {
        try {
            const response = await fetch(url, {
                mode: 'cors',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to download image: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('image/')) {
                throw new Error('Invalid image format received');
            }

            const blob = await response.blob();
            const fileName = decodeURIComponent(url.split('/').pop() || 'image.jpg');
            
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Error downloading image:', error);
            throw error;
        }
    };

    const handleDownloadAll = async () => {
        let successCount = 0;
        let failedUrls: string[] = [];

        for (const url of matchedImages) {
            try {
                await handleDownload(url);
                successCount++;
                // Add a small delay between downloads to prevent browser throttling
                await new Promise(resolve => setTimeout(resolve, 800));
            } catch (error) {
                console.error(`Failed to download image from ${url}:`, error);
                failedUrls.push(url);
            }
        }

        if (failedUrls.length === 0) {
            alert(`Successfully downloaded all ${successCount} images!`);
        } else {
            alert(`Downloaded ${successCount} images. Failed to download ${failedUrls.length} images. Please try again later.`);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen bg-white">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md border-2 border-aquamarine">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Upload Selfie</h2>
                    <Link to="/" className="flex items-center text-gray-600 hover:text-gray-800">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Upload
                    </Link>
                </div>

                {uploadError && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                        {uploadError}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="selfie-upload" className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-turquoise border-dashed cursor-pointer hover:border-aquamarine hover:bg-champagne transition-colors duration-200">
                            <div className="flex flex-col items-center">
                                <Camera className="w-8 h-8 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-500">
                                    <span className="font-semibold">Click to upload or drag and drop</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Take a clear selfie for best results
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    JPEG or PNG up to 5MB
                                </p>
                            </div>
                            <input
                                id="selfie-upload"
                                type="file"
                                className="hidden"
                                onChange={handleSelfieChange}
                                accept="image/jpeg,image/png"
                            />
                        </label>
                    </div>

                    {previewUrl && (
                        <div className="relative w-32 h-32 mx-auto">
                            <img
                                src={previewUrl}
                                alt="Selfie preview"
                                className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                                onClick={clearSelfie}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={isUploading || !selfie}
                        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-turquoise hover:bg-aquamarine hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-turquoise transition-colors duration-200 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isUploading ? 'Processing...' : 'Upload & Compare'}
                    </button>
                </div>

                {matchedImages.length > 0 && (
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                Found {matchedImages.length} matching images!
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
                                {matchedImages.map((url, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={url}
                                            alt={`Match ${index + 1}`}
                                            className="w-full h-40 object-cover rounded-lg shadow-sm"
                                            onClick={() => setSelectedImage(url)}
                                        />
                                        <button
                                            onClick={() => handleDownload(url)}
                                            className="absolute bottom-2 right-2 bg-turquoise text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Download image"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {matchedImages.length > 1 && (
                                <button
                                    onClick={handleDownloadAll}
                                    className="mt-4 px-6 py-2 bg-turquoise text-white rounded-md hover:bg-aquamarine hover:text-gray-800 transition-colors duration-200 flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Download All Matched Images
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {selectedImage && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
                        <div className="relative max-w-4xl w-full">
                            <img
                                src={selectedImage}
                                alt="Selected match"
                                className="w-full h-auto rounded-lg"
                            />
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg"
                            >
                                <X className="w-6 h-6 text-gray-800" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadSelfie;