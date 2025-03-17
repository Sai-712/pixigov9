import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Image, Video, Users, Plus, X, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { storeEventData, getEventStatistics, getUserEvents, EventData, deleteEvent } from '../config/localEventStorage';
// Removed unused import

interface Event {
    id: string;
    name: string;
    date: string;
    description: string;
    coverImage?: string;
}

interface StatsCardProps {
    icon: React.ReactNode;
    title: string;
    count: number;
    bgColor: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, title, count, bgColor }) => (
    <div className={`${bgColor} p-6 rounded-lg shadow-md flex items-center space-x-4`}>
        <div className="p-3 bg-white rounded-full">{icon}</div>
        <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="text-2xl font-bold text-white">{count}</p>
        </div>
    </div>
);

const EventDashboard = () => {
    const navigate = useNavigate();
    const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean; eventId: string}>({isOpen: false, eventId: ''});

    const [
       
    ] = useState([])

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState<Event>({ id: '', name: '', date: '', description: '' });
    const [eventImage, setEventImage] = useState<File | null>(null);
    const [stats, setStats] = useState({ eventCount: 0, photoCount: 0, videoCount: 0, guestCount: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [events, setEvents] = useState<EventData[]>([]);
    const [showAllEvents, setShowAllEvents] = useState(false);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const userEmail = localStorage.getItem('userEmail');
            if (!userEmail) {
                console.error('User email not found');
                return;
            }
            const userEvents = await getUserEvents(userEmail);
            if (Array.isArray(userEvents)) {
                setEvents(userEvents);
                // Update statistics after loading events
                await loadEventStatistics();
            } else {
                console.error('Invalid events data received');
            }
        } catch (error) {
            console.error('Error loading events:', error);
        }
    };

    useEffect(() => {
        loadEventStatistics();
    }, []);

    const loadEventStatistics = async () => {
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
            const statistics = await getEventStatistics(userEmail);
            setStats(statistics);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setEventImage(e.target.files[0]);
        }
    };

    const handleImageUpload = async (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const userEmail = localStorage.getItem('userEmail');
            if (!userEmail) throw new Error('User not authenticated');

            const eventId = uuidv4();
            let coverImageUrl = '';

            if (eventImage) {
                coverImageUrl = await handleImageUpload(eventImage);
            }

            const eventData: Omit<EventData, 'createdAt' | 'updatedAt'> = {
                id: eventId,
                name: newEvent.name,
                date: newEvent.date,
                description: newEvent.description,
                coverImage: coverImageUrl,
                photoCount: 0,
                videoCount: 0,
                guestCount: 0,
                userEmail,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const success = await storeEventData(eventData);
            if (success) {
                await loadEventStatistics();
                await loadEvents();
                setIsModalOpen(false);
                setNewEvent({ id: '', name: '', date: '', description: '' });
                setEventImage(null);
                navigate(`/event/${eventId}`);
            }
        } catch (error) {
            console.error('Error creating event:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Event Dashboard</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center bg-primary text-white py-2 px-4 rounded-lg hover:bg-secondary transition-colors duration-200"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Event
                </button>
            </div>

            {/* Create Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Create New Event</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-2" htmlFor="eventName">
                                    Event Name
                                </label>
                                <input
                                    type="text"
                                    id="eventName"
                                    value={newEvent.name}
                                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2" htmlFor="eventDate">
                                    Event Date
                                </label>
                                <input
                                    type="date"
                                    id="eventDate"
                                    value={newEvent.date}
                                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2" htmlFor="eventDescription">
                                    Description
                                </label>
                                <textarea
                                    id="eventDescription"
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-primary h-32"
                                    required
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2" htmlFor="eventCover">
                                    Cover Image
                                </label>
                                <input
                                    type="file"
                                    id="eventCover"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-secondary transition-colors duration-200 disabled:opacity-50"
                            >
                                {isLoading ? 'Creating Event...' : 'Create Event'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {/* Stats Cards */}
                <div onClick={() => setShowAllEvents(!showAllEvents)} className="cursor-pointer">
                    <StatsCard
                        icon={<Image className="w-6 h-6 text-primary" />}
                        title="Total Events"
                        count={stats.eventCount}
                        bgColor="bg-primary"
                    />
                </div>
                <StatsCard
                    icon={<Camera className="w-6 h-6 text-secondary" />}
                    title="Total Photos"
                    count={stats.photoCount}
                    bgColor="bg-secondary"
                />
                <StatsCard
                    icon={<Video className="w-6 h-6 text-turquoise" />}
                    title="Total Videos"
                    count={stats.videoCount}
                    bgColor="bg-turquoise"
                />
            </div>

            

            <div className="text-center mb-8">
               
            </div>

            {/* Event Grid */}
            {/* Delete Confirmation Modal */}
            {deleteConfirmation.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Delete</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this event? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setDeleteConfirmation({isOpen: false, eventId: ''})}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const success = await deleteEvent(deleteConfirmation.eventId);
                                    if (success) {
                                        await loadEvents();
                                        await loadEventStatistics();
                                    }
                                    setDeleteConfirmation({isOpen: false, eventId: ''});
                                }}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAllEvents && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">All Events</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.isArray(events) && events.map((event) => (
                            <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                {event.coverImage ? (
                                    <img
                                        src={event.coverImage}
                                        alt={event.name}
                                        className="w-full h-48 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                        <Camera className="w-12 h-12 text-gray-400" />
                                    </div>
                                )}
                                <div className="p-4">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{event.name}</h3>
                                    <p className="text-gray-600 mb-2">{new Date(event.date).toLocaleDateString()}</p>
                                    <p className="text-gray-500 mb-4 line-clamp-2">{event.description}</p>
                                    <div className="flex justify-between items-center">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                            
                                        </div>
                                        <div className="mt-4 flex justify-end space-x-4">
                                            <Link
                                                to={`/view-event/${event.id}`}
                                                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-colors duration-200"
                                            >
                                                View Event
                                            </Link>
                                            <button
                                                onClick={() => setDeleteConfirmation({isOpen: true, eventId: event.id})}
                                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventDashboard;