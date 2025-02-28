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
    let roomsQuery = query(collection(firestore, "room"), where("status", "==" , "published"));
    console.log(roomsQuery);

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

          // Apply property-related filters
          // const filteredRooms = roomsWithProperties.filter((room) => {
          //   if (!room.propertyDetails) return false;
          //   if (location && room.propertyDetails.location?._ref !== location)
          //     return false;
          //   if (
          //     propertyType &&
          //     room.propertyDetails.propertyType !== propertyType
          //   )
          //     return false;
          //   if (
          //     colivingCapacity &&
          //     room.propertyDetails.colivingCapacity > colivingCapacity
          //   )
          //     return false;
          //   return true;
          // });

          // Extract remaining available semesters for the specified year
          const roomsWithAvailableSemesters = roomsWithProperties.map((room) => {
            const remainingSemesters = getRemainingAvailableSemesters(
              room,
              year
            );
            return {
              ...room,
              remainingSemesters: remainingSemesters, // Add remaining available semesters to the room object
            };
          });

          onSnapshotCallback(roomsWithAvailableSemesters);
        } catch (error) {
          console.error("Error processing rooms:", error);
          onSnapshotCallback([]); // Fallback in case of error
          return (() => {});
        }
      });

      return unsubscribe ?? (() => {});
    }

    // Apply room-level filters if available
    // if (year) {
    //   roomsQuery = query(roomsQuery, where("year", "==", year));
    // }
    if (roomType) {
      roomsQuery = query(roomsQuery, where("roomType", "==", roomType));
    }

    // Handle pricing filters
    if (semester) {
      if (Array.isArray(semester)) {
        roomsQuery = query(
          roomsQuery,
          where("priceWinter", ">=", minPrice || 0),
          where("priceWinter", "<=", maxPrice || Infinity),
        );
      } else if (semester === "Summer") {
        if (minPrice !== undefined)
          roomsQuery = query(roomsQuery, where("priceSummer", ">=", minPrice));
        if (maxPrice !== undefined)
          roomsQuery = query(roomsQuery, where("priceSummer", "<=", maxPrice));
      } else {
        if (minPrice !== undefined)
          roomsQuery = query(roomsQuery, where("priceSummer", ">=", minPrice));
        if (maxPrice !== undefined)
          roomsQuery = query(roomsQuery, where("priceSummer", "<=", maxPrice));
      }
    }

    // Listen for real-time updates
    const unsubscribe = onSnapshot(roomsQuery, async (snapshot) => {
      try {
        const rooms = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Rooms:", rooms);

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


        // Apply property-related filters
        const filteredRooms = roomsWithProperties.filter((room) => {
          if (!room.propertyDetails) return false;
          if (location && room.propertyDetails.location?._ref !== location)
            return false;
          if (
            propertyType &&
            room.propertyDetails.propertyType !== propertyType
          )
            return false;
          if (
            colivingCapacity &&
            room.propertyDetails.colivingCapacity > colivingCapacity
          )
            return false;
          return true;
        });

        // Extract remaining available semesters for the specified year
        const roomsWithAvailableSemesters = filteredRooms.map((room) => {
          const remainingSemesters = getRemainingAvailableSemesters(room, year);
          return {
            ...room,
            remainingSemesters: remainingSemesters, // Add remaining available semesters to the room object
          };
        });

        onSnapshotCallback(roomsWithAvailableSemesters);
      } catch (error) {
        console.error("Processing error:", error);
        onSnapshotCallback([]);
      }
    });

    return unsubscribe ??  (() => {}); // Return a no-op function if an error occurs;
  } catch (error) {
    console.error("Initial error:", error);
    onSnapshotCallback([]);
    return () => {};
  }
};


export const fetchRoomsBySlug = async (slug, onSnapshotCallback) => {
  try {
    // Base collection reference with slug filter
    console.log(slug);
    let roomsQuery = query(
      collection(firestore, "room"),
      where("slug.current", "==", slug),
      where("status", "==" , "published")
    );

    // Listen for real-time updates
    const unsubscribe = onSnapshot(roomsQuery, async (snapshot) => {
      try {
        const rooms = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Rooms:", rooms);

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
          const remainingSemesters = getRemainingAvailableSemesters(
            room
          );
          return {
            ...room,
            remainingSemesters: remainingSemesters, // Add remaining available semesters to the room object
          };
        });
        onSnapshotCallback(roomsWithAvailableSemesters);
      } catch (error) {
        console.error("Processing error:", error);
        onSnapshotCallback([]);
        return () => {};
      }
    });

    return unsubscribe ??  (() => {}); // Return a no-op function if an error occurs;
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
    }));

    console.log("Fetched locations:", locations);

    return locations;
  } catch (error) {
    console.error("Error fetching locations:", error);
    return []; // Return an empty array in case of an error
  }
};



// ✅ Function to fetch Sanity image URL
// const getSanityImageUrl = async (imageRef) => {
//   try {
//     if (!imageRef) return null; // Ensure imageRef is valid
//     const imageData = await client.fetch(`*[_id == $imageRef][0]{"url": asset->url}`, { imageRef });
//     return imageData?.url || null;
//   } catch (error) {
//     console.error("Error fetching image URL from Sanity:", error);
//     return null;
//   }
// };

// Helper function to get remaining available semesters for a specific year


