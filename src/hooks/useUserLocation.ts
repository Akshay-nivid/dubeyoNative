import { useEffect, useState } from 'react';

export const useUserLocation = () => {
    const [location, setLocation] = useState({
        coordinates: { lat: 0, lon: 0 },
        place: "Dubai, UAE"
    });

    useEffect(() => {
        // Mock location
        // In real app, use expo-location
    }, []);

    return location;
};
