/*export const getAgeGroup = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
/*
   if (age <= 9) {
    return "Kids (0-9)";
  }

  if (age <= 17) {
    return "Teens (10-17)";
  }

  return "Adults (18+)";
  */
if (age <= 9) {
    return {
      ageGroup: "Kids (0-9)",
      ageKey: "kids",
    };
  }

  if (age <= 17) {
    return {
      ageGroup: "Teens (10-17)",
      ageKey: "teens",
    };
  }

  return {
    ageGroup: "Adults (18+)",
    ageKey: "adults",
  };

};
*/
export const getAgeGroup = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
/*
   if (age <= 9) {
    return "Kids (0-9)";
  }

  if (age <= 17) {
    return "Teens (10-17)";
  }

  return "Adults (18+)";
  */
if (age <= 12) {
    return {
      ageGroup: "Kids (0-12)",
      ageKey: "kids",
    };
  }

  if (age <= 17) {
    return {
      ageGroup: "Teens (13-17)",
      ageKey: "teens",
    };
  }

  return {
    ageGroup: "Adults (18+)",
    ageKey: "adults",
  };

};