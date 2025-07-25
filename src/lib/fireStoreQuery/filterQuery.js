import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { app } from "../firebase"; // Ensure Firebase is initialized
import { getSanityImageUrl } from "@/sanity/lib/image";
import { getRemainingAvailableSemesters } from "./utils";

const firestore = getFirestore(app); // Get Firestore instance

export const fetchFilteredRooms = async (filters, onSnapshotCallback) => {
  const {
    semester,
    year,
    roomType,
    location,
    minPrice,
    maxPrice,
    propertyType,
    colivingCapacity,
  } = filters;

  try {
    // Base collection reference
    let roomsQuery = query(
      collection(firestore, "room"),
      where("status", "==", "published")
    );

    // If no filters are provided, fetch all available and remaining rooms
    if (
      !semester &&
      !year &&
      !roomType &&
      !location &&
      minPrice === undefined &&
      maxPrice === undefined &&
      !propertyType &&
      !colivingCapacity
    ) {
      const unsubscribe = onSnapshot(roomsQuery, async (snapshot) => {
        const rooms = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        try {
          // Fetch and merge property details
          const roomsWithProperties = await Promise.all(
            rooms.map(async (room) => {
              try {
                const propertyRef = doc(
                  firestore,
                  "property",
                  room.property?._ref
                );
                const propertySnap = await getDoc(propertyRef);
                const propertyDetails = propertySnap.exists()
                  ? propertySnap.data()
                  : null;

                // Fetch Image URL from Sanity
                const imageUrl =
                  room.images?.length > 0
                    ? room?.images
                    : propertyDetails?.images;

                // await getSanityImageUrl(room.images?.[0])
                return {
                  ...room,
                  propertyDetails: propertyDetails,
                  imageUrl, // Include image URL
                };
              } catch (error) {
                console.error("Error fetching property:", error);
                return { ...room, propertyDetails: null, imageUrl: null };
              }
            })
          );


          // Extract remaining available semesters for the specified year
          const roomsWithAvailableSemesters = roomsWithProperties.map(
            (room) => {
              const remainingSemesters = getRemainingAvailableSemesters(room);
              return {
                ...room,
                remainingSemesters: remainingSemesters, // Add remaining available semesters to the room object
              };
            }
          );

          // Sort rooms alphabetically by title
          const sortedRooms = roomsWithAvailableSemesters.sort((a, b) => {
            const titleA = a.title || '';
            const titleB = b.title || '';
            return titleA.localeCompare(titleB);
          });

          listenToValidProposedPeriods(
            sortedRooms,
            onSnapshotCallback
          );
          // onSnapshotCallback(sortedRooms);
        } catch (error) {
          console.error("Error processing rooms:", error);
          onSnapshotCallback([]); // Fallback in case of error
          return () => {};
        }
      });

      return unsubscribe ?? (() => {});
    }

 
    if (roomType) {
      roomsQuery = query(roomsQuery, where("roomType", "==", roomType));
    }

 

    // Listen for real-time updates
    const unsubscribe = onSnapshot(roomsQuery, async (snapshot) => {
      try {
        const rooms = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch and merge property details
        const roomsWithProperties = await Promise.all(
          rooms.map(async (room) => {
            try {
              const propertyRef = doc(
                firestore,
                "property",
                room.property?._ref
              );
              const propertySnap = await getDoc(propertyRef);
              const propertyDetails = propertySnap.exists()
                ? propertySnap.data()
                : null;

              // Fetch Image URL from Sanity
              const imageUrl =
                room.images?.length > 0
                  ? room?.images
                  : propertyDetails?.images;

              return {
                ...room,
                propertyDetails: propertyDetails,
                imageUrl, // Include image URL
              };
            } catch (error) {
              console.error("Error fetching property:", error);
              return { ...room, propertyDetails: null, imageUrl: null };
            }
          })
        );

        const selectedLocations = location
        ? Array.isArray(location)
          ? location
          : [location]
        : [];
      
      const filteredRooms = roomsWithProperties.filter((room) => {
        if (!room.propertyDetails) return false;
      
        // ✅ Location filter (OR matching)
        if (
          selectedLocations.length > 0 &&
          !selectedLocations.includes(room.propertyDetails.location?._ref)
        ) {
          return false;
        }
      
        // ✅ Property type filter
        if (propertyType && room.propertyDetails.propertyType !== propertyType) {
          return false;
        }
      
        // ✅ Coliving capacity filter
        if (
          colivingCapacity &&
          room.propertyDetails.colivingCapacity > colivingCapacity
        ) {
          return false;
        }
      
        return true; // Keep room if all conditions pass
      });
      
        

        // Extract remaining available semesters for the specified year
        const roomsWithAvailableSemesters = filteredRooms.map((room) => {
          const remainingSemesters = getRemainingAvailableSemesters(
            room,
            { maxPrice, minPrice },
            semester
          );
          return {
            ...room,
            remainingSemesters: remainingSemesters, // Add remaining available semesters to the room object
          };
        });

        // Sort rooms alphabetically by title
        const sortedRooms = roomsWithAvailableSemesters.sort((a, b) => {
          const titleA = a.title || '';
          const titleB = b.title || '';
          return titleA.localeCompare(titleB);
        });

        listenToValidProposedPeriods(
          sortedRooms,
          onSnapshotCallback
        );

        // onSnapshotCallback(sortedRooms);
      } catch (error) {
        console.error("Processing error:", error);
        onSnapshotCallback([]);
      }
    });

    return unsubscribe ?? (() => {}); // Return a no-op function if an error occurs;
  } catch (error) {
    console.error("Initial error:", error);
    onSnapshotCallback([]);
    return () => {};
  }
};

export const fetchRoomsBySlug = async (slug, onSnapshotCallback) => {
  try {
    // Base collection reference with slug filter
    let roomsQuery = query(
      collection(firestore, "room"),
      where("slug.current", "==", slug),
      where("status", "==", "published")
    );

    // Listen for real-time updates
    const unsubscribe = onSnapshot(roomsQuery, async (snapshot) => {
      try {
        const rooms = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch and merge property details
        const roomsWithProperties = await Promise.all(
          rooms.map(async (room) => {
            try {
              const propertyRef = doc(
                firestore,
                "property",
                room.property?._ref
              );
              const propertySnap = await getDoc(propertyRef);
              const propertyDetails = propertySnap.exists()
                ? propertySnap.data()
                : null;

              // Fetch Image URL from Sanity
              const imageUrl = await getSanityImageUrl(
                propertyDetails?.images?.[0]
              );

              return {
                ...room,
                propertyDetails: propertyDetails,
                imageUrl, // Include image URL
              };
            } catch (error) {
              console.error("Error fetching property:", error);
              return { ...room, propertyDetails: null, imageUrl: null };
            }
          })
        );

        const roomsWithAvailableSemesters = roomsWithProperties.map((room) => {
          const remainingSemesters = getRemainingAvailableSemesters(room);
          return {
            ...room,
            remainingSemesters: remainingSemesters, // Add remaining available semesters to the room object
          };
        });

        // Sort rooms alphabetically by title
        const sortedRooms = roomsWithAvailableSemesters.sort((a, b) => {
          const titleA = a.title || '';
          const titleB = b.title || '';
          return titleA.localeCompare(titleB);
        });

        listenToValidProposedPeriods(
          sortedRooms,
          onSnapshotCallback
        );
        // onSnapshotCallback(sortedRooms);
      } catch (error) {
        console.error("Processing error:", error);
        onSnapshotCallback([]);
        return () => {};
      }
    });

    return unsubscribe ?? (() => {}); // Return a no-op function if an error occurs;
  } catch (error) {
    console.error("Initial error:", error);
    onSnapshotCallback([]);
    return () => {}; // Return a no-op function if an error occurs
  }
};

export const fetchAllLocations = async () => {
  try {
    // Reference to the "location" collection
    const locationsRef = collection(firestore, "location");

    // Fetch all documents from the "location" collection
    const snapshot = await getDocs(locationsRef);

    // Map over the documents and return the data
    const locations = snapshot.docs.map((doc) => ({
      value: doc.id,
      label: doc.data().title,
      descriptions: doc.data()?.descriptions,
      additionalAddresses: doc.data()?.additionalAddresses,
    }));

    return locations;
  } catch (error) {
    console.error("Error fetching locations:", error);
    return []; // Return an empty array in case of an error
  }
};


// Helper function to get remaining available semesters for a specific year

export function listenToValidProposedPeriods(
  roomsWithAvailableSemesters,
  onSnapshotCallback
) {
  const now = new Date();

  // Firestore query to get only non-expired proposed periods
  const q = query(
    collection(firestore, "proposedBookedPeriods"),
    where("expiresAt", ">", now)
  );

  // Real-time listener
  return onSnapshot(q, (snapshot) => {
    const proposedPeriods = snapshot.docs.map((doc) => doc.data());

    const updatedRooms = roomsWithAvailableSemesters.map((room) => {
      const filteredSemesters = room.remainingSemesters.filter(
        (semesterObj) =>
          !proposedPeriods.some(
            (period) =>
              period.roomId === room.id &&
              period.semester === semesterObj.semester &&
              period.year === semesterObj.year
          )
      );

      return { ...room, remainingSemesters: filteredSemesters };
    });

    onSnapshotCallback(updatedRooms); // Call the provided callback with updated data
  });
}