export interface EventData {
  id: string;
  name: string;
  date: string;
  description: string;
  coverImage?: string;
  photoCount: number;
  videoCount: number;
  guestCount: number;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
}

export const storeEventData = async (eventData: EventData): Promise<boolean> => {
  try {
    const userEmail = eventData.userEmail;
    const events = await getUserEvents(userEmail);
    
    // Find if event already exists
    const existingEventIndex = events.findIndex(event => event.id === eventData.id);
    
    if (existingEventIndex !== -1) {
      // Update existing event
      events[existingEventIndex] = eventData;
    } else {
      // Add new event
      events.push(eventData);
    }
    
    // Store updated events array
    localStorage.setItem(`events_${userEmail}`, JSON.stringify(events));
    return true;
  } catch (error) {
    console.error('Error storing event data:', error);
    return false;
  }
};

export const getUserEvents = async (userEmail: string): Promise<EventData[]> => {
  try {
    const eventsJson = localStorage.getItem(`events_${userEmail}`);
    return eventsJson ? JSON.parse(eventsJson) : [];
  } catch (error) {
    console.error('Error getting user events:', error);
    return [];
  }
};

export const getEventStatistics = async (userEmail: string) => {
  try {
    const events = await getUserEvents(userEmail);
    
    return {
      eventCount: events.length,
      photoCount: events.reduce((sum, event) => sum + (event.photoCount || 0), 0),
      videoCount: events.reduce((sum, event) => sum + (event.videoCount || 0), 0),
      guestCount: events.reduce((sum, event) => sum + (event.guestCount || 0), 0)
    };
  } catch (error) {
    console.error('Error getting event statistics:', error);
    return {
      eventCount: 0,
      photoCount: 0,
      videoCount: 0,
      guestCount: 0
    };
  }
};

export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) throw new Error('User not authenticated');

    const events = await getUserEvents(userEmail);
    const updatedEvents = events.filter(event => event.id !== eventId);
    
    localStorage.setItem(`events_${userEmail}`, JSON.stringify(updatedEvents));
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
};