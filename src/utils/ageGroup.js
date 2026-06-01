export const getAgeGroup = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age <= 6) return "Kids (0-6)";
  if (age <= 9) return "Children (7-9)";
  if (age <= 12) return "Kids (10-12)";
  if (age <= 17) return "Teens (13-17)";
  if (age <= 25) return "Young Adults (18-25)";
  return "Adults (26+)";
};
