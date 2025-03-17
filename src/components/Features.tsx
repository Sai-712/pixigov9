import React from 'react';
import { Camera, Image, Upload, Search, Cloud, Lock } from 'lucide-react';

const features = [
  {
    name: 'AI-Powered Organization',
    description:
      'Our advanced AI automatically categorizes your photos by people, places, objects, and events, making them easily searchable.',
    icon: Search,
  },
  {
    name: 'Unlimited Cloud Storage',
    description:
      'Store all your memories in one place with unlimited cloud storage. Access your photos from any device, anywhere.',
    icon: Cloud,
  },
  {
    name: 'Easy Sharing',
    description:
      'Share your photos with friends and family through customizable albums, links, or directly to social media.',
    icon: Upload,
  },
  {
    name: 'Privacy First',
    description:
      'Your photos are yours alone. We use end-to-end encryption to ensure your memories stay private and secure.',
    icon: Lock,
  },
  {
    name: 'Automatic Backup',
    description:
      'Never lose a photo again. Pixigo automatically backs up your photos from your phone, computer, and other devices.',
    icon: Camera,
  },
  {
    name: 'Smart Editing',
    description:
      'Edit your photos with our intuitive tools. Enhance colors, remove blemishes, and apply filters with just a few taps.',
    icon: Image,
  },
];

const Features = () => {
  return (
    <div id="features" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Store Smarter</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to manage your photo collection
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Pixigo combines powerful organization tools with seamless sharing capabilities to give you complete control over your photo library.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default Features;