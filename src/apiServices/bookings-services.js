
import { v4 as uuidv4 } from "uuid";

export const validateAcademicYear = (year) => {
  return /^\d{4}\/\d{4}$/.test(year);
};

// Updated deadline validation for summer months
export const validateBookingDeadline = (year, semester) => {
  const [, endYear] = year.split('/').map(Number);
  const now = new Date();

  const deadlines = {
    "1st Semester": new Date(`${endYear}-01-31`),
    "2nd Semester": new Date(`${endYear}-06-30`),
    "July": new Date(`${endYear}-07-31`),
    "August": new Date(`${endYear}-08-31`),
  };

  return now <= (deadlines[semester] || new Date());
};


export const findOrCreateUser = async (email, userDetails, client) => {
  let user = await client.fetch(`*[_type == "user" && email == $email][0]`, { email });

  if (!user) {
    user = await client.create({
      _type: "user",
      ...userDetails,
      age: Number(userDetails.age) || 18
    });
  } else {
    await updateUser(user, userDetails, client);
  }

  return user;
};

export const updateUser = async (existingUser, userDetails, client) => {
  const updates = {};
  [
    "name", "age", "genre", "permanentAddress",
    "nationality", "idNumber", "currentProfession", "currentLocation"
  ].forEach(field => {
    if (existingUser[field] !== userDetails[field]) {
      updates[field] = userDetails[field];
    }
  });

  if (Object.keys(updates).length > 0) {
    await client.patch(existingUser._id).set(updates).commit();
  }
};


export const processBookingPeriods = async (bookingPeriods, useCommonDetails, commonUser, client) => {
  const processedUsers = new Map();
  const roomUpdatesMap = new Map();
  const bookedPeriods = [];
  const validationErrors = [];

  for (const period of bookingPeriods) {
    let userRef;

    if (useCommonDetails) {
      userRef = commonUser._id;
    } else {
      const userDetails = period.userDetails;

      let user = processedUsers.get(userDetails.email);
      if (!user) {
        user = await findOrCreateUser(userDetails.email, userDetails, client);
        processedUsers.set(userDetails.email, user);
      }

      userRef = user._id;
    }

    const roomId = period.roomId;
    const roomData = await client.getDocument(roomId);

    if (!validateAcademicYear(period.year)) {
      validationErrors.push("Invalid academic year format. Expected format: YYYY/YYYY");
    } else if (!validateBookingDeadline(period.year, period.semester)) {
      validationErrors.push(`${period.semester} semester can't be booked past its deadline.`);
    }

    const periodKey = uuidv4();
    bookedPeriods.push({
      _key: periodKey,
      bookedByUser: { _type: "reference", _ref: commonUser._id },
      bookedForUser: { _type: "reference", _ref: userRef },
      bookedByUserEmail: bookingPeriods[0].userDetails.email,
      userDetailsInOneLine: useCommonDetails ? JSON.stringify(commonUser): JSON.stringify(period.userDetails.name),
      room: { _type: "reference", _ref: roomId },
      roomId: roomId,
      roomTitle: roomData.title,
      semester: period.semester,
      summerPrice: roomData.priceSummer,
      winterPriceMonthly: roomData.priceWinter,
      year: period.year,
      startYear: period.year.split("/")[0],
      endYear: period.year.split("/")[1],
      services: JSON.stringify(period?.services?.map(item => item?.name) ?? []),
    });

    if (!roomUpdatesMap.has(roomId)) {
      roomUpdatesMap.set(roomId, { currentPeriods: roomData.bookedPeriods || [], newPeriods: [] });
    }

    roomUpdatesMap.get(roomId).newPeriods.push({
      _key: periodKey,
      semester: period.semester,
      year: period.year,
      services: JSON.stringify(period?.services?.map(item => item?.name) ?? []),
    });
  }

  return { bookedPeriods, roomUpdatesMap, validationErrors };
};











