export const schools = [
  { id: 1, name: "Escola Horizonte", city: "Salvador", state: "BA" },
];

export const users = [
  { id: 1, name: "Prof. Rafael", role: "teacher" },
  { id: 2, name: "Lia Santos", role: "student" },
];

export const teachers = [{ id: 1, user_id: 1, school_id: 1 }];
export const students = [{ id: 1, user_id: 2, school_id: 1, grade: "5º ano" }];
export const enrollments = [{ id: 1, class_id: 1, student_id: 1 }];

export function getDemoUser(role) {
  const user = users.find((item) => item.role === role);
  const profiles = role === "teacher" ? teachers : students;
  const profile = profiles.find((item) => item.user_id === user?.id);
  const school = schools.find((item) => item.id === profile?.school_id);
  if (!user || !profile || !school) throw new Error("Perfil sem vínculo escolar válido.");
  return {
    ...user,
    school_id: school.id,
    school,
    teacher_id: role === "teacher" ? profile.id : null,
    student_id: role === "student" ? profile.id : null,
  };
}

export function getSchoolClasses(user, groups) {
  const schoolGroups = groups.filter((group) => group.school_id === user.school_id);
  if (user.role === "teacher") return schoolGroups.filter((group) => group.teacher_id === user.teacher_id);
  if (user.role === "student") {
    const memberships = enrollments.filter((item) => item.student_id === user.student_id);
    return schoolGroups.filter((group) => memberships.some((item) => item.class_id === group.id));
  }
  return [];
}
