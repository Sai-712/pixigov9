import React, { useState, useEffect } from 'react';
import { ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET_NAME, rekognitionClient } from '../config/aws';
import { region as awsRegion } from '../config/aws';
import { DetectFacesCommand, CompareFacesCommand } from '@aws-sdk/client-rekognition';
import { Download, Trash2, Camera } from 'lucide-react';

interface EventImagesProps {
  eventId: string;
}

interface ProcessedImage {
  url: string;
  key: string;
  hasFace: boolean;
  faceCoordinates?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

const EventImages = ({ eventId }: EventImagesProps) => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingStatus, setProcessingStatus] = useState('');
  const [deleting, setDeleting] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);

  const handleDownload = async (image: ProcessedImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.key.split('/').pop() || 'image';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleDelete = async (image: ProcessedImage) => {
    try {
      setDeleting(prev => [...prev, image.key]);
      const deleteCommand = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: image.key
      });
      await s3Client.send(deleteCommand);
      setImages(prev => prev.filter(img => img.key !== image.key));
    } catch (error) {
      console.error('Error deleting image:', error);
    } finally {
      setDeleting(prev => prev.filter(key => key !== image.key));
    }
  };

  useEffect(() => {
    const fetchEventImages = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) throw new Error('User not authenticated');

        // List objects in the specific event folder
        const listCommand = new ListObjectsV2Command({
          Bucket: S3_BUCKET_NAME,
          Prefix: `events/${userEmail}/${eventId}/`
        });

        const result = await s3Client.send(listCommand);
        if (!result.Contents) return;

        const imageItems = result.Contents
          .filter(item => item.Key && item.Key.match(/\.(jpg|jpeg|png)$/i))
          .map(item => ({
            url: `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${item.Key}`,
            key: item.Key || ''
          }));

        // Process images for faces and duplicates
        // Map all images directly without face detection
        const processedImages = imageItems.map(item => ({
          url: item.url,
          key: item.key,
          hasFace: false
        }));

        setImages(processedImages);
        setProcessingStatus('');
      } catch (error) {
        console.error('Error fetching event images:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
    
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) throw new Error('User not authenticated');
    
      setProcessingStatus('Uploading images...');
      const files = Array.from(e.target.files);
    
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const key = `events/${userEmail}/${eventId}/${Date.now()}-${file.name}`;
          
          const uploadCommand = new PutObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: key,
            Body: file,
            ContentType: file.type
          });
    
          await s3Client.send(uploadCommand);
          setProcessingStatus(`Uploaded ${i + 1} of ${files.length} images`);
        }
    
        // Refresh the images list
        await fetchEventImages();
      } catch (error) {
        console.error('Error uploading images:', error);
        setProcessingStatus('Error uploading images');
      } finally {
        setProcessingStatus('');
      }
    };

    fetchEventImages();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-lg">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Event Photos</h2>
        <label className="cursor-pointer bg-primary text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-secondary transition-colors duration-200 flex items-center text-sm sm:text-base whitespace-nowrap w-full sm:w-auto justify-center">
          <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Upload Photos
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (!e.target.files || e.target.files.length === 0) return;
            
              const userEmail = localStorage.getItem('userEmail');
              if (!userEmail) throw new Error('User not authenticated');
            
              setProcessingStatus('Uploading images...');
              const files = Array.from(e.target.files);
            
              const uploadImages = async () => {
                try {
                  for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const key = `events/${userEmail}/${eventId}/${Date.now()}-${file.name}`;
                    
                    // Convert file to buffer
                    const arrayBuffer = await file.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    
                    const uploadCommand = new PutObjectCommand({
                      Bucket: S3_BUCKET_NAME,
                      Key: key,
                      Body: buffer,
                      ContentType: file.type
                    });
            
                    await s3Client.send(uploadCommand);
                    setProcessingStatus(`Uploaded ${i + 1} of ${files.length} images`);
                  }
            
                  // Refresh the images list
                  await fetchEventImages();
                } catch (error) {
                  console.error('Error uploading images:', error);
                  setProcessingStatus('Error uploading images');
                } finally {
                  setProcessingStatus('');
                }
              };

              uploadImages();
            }}
            className="hidden"
          />
        </label>
      </div>
      {processingStatus && (
        <div className="text-center text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary mr-3"></div>
            {processingStatus}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:gap-4">
        <div className="flex-1 w-full">
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 p-2 sm:p-4">
            {/* Image Grid */}
            {images.length === 0 && !loading && (
              <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No images uploaded for this event yet.</p>
                <p className="text-gray-400 text-sm mt-2">Upload some photos to get started</p>
              </div>
            )}

            {images.map((image, index) => (
              <div
                key={image.key}
                className="relative aspect-square overflow-hidden rounded-lg shadow-md group hover:shadow-xl transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.url}
                  alt={`Event image ${index + 1}`}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 sm:touch-none">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(image);
                    }}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors duration-200"
                  >
                    <Download className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(image);
                    }}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors duration-200"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </div>
                {image.hasFace && image.faceCoordinates && (
                  <div
                    className="absolute border-2 border-primary"
                    style={{
                      left: `${image.faceCoordinates?.left !== undefined ? image.faceCoordinates.left * 100 : 0}%`,
                      top: `${image.faceCoordinates.top * 100}%`,
                      width: `${image.faceCoordinates.width * 100}%`,
                      height: `${image.faceCoordinates.height * 100}%`
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-1/3 p-4 sticky top-0 h-screen">
          {selectedImage ? (
            <div className="h-full flex flex-col">
              <div className="relative flex-grow rounded-lg overflow-hidden">
                <img
                  src={selectedImage.url}
                  alt="Selected event image"
                  className="object-contain w-full h-full"
                />
                {selectedImage.hasFace && selectedImage.faceCoordinates && (
                  <div
                    className="absolute border-2 border-primary"
                    style={{
                      left: `${selectedImage.faceCoordinates.left * 100}%`,
                      top: `${selectedImage.faceCoordinates.top * 100}%`,
                      width: `${selectedImage.faceCoordinates.width * 100}%`,
                      height: `${selectedImage.faceCoordinates.height * 100}%`
                    }}
                  />
                )}
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => handleDownload(selectedImage)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors duration-200 flex items-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download
                </button>
                <button
                  onClick={() => handleDelete(selectedImage)}
                  disabled={deleting.includes(selectedImage.key)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <p>Select an image to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventImages;