export const TEAM_CREDENTIALS = [
  {
    name: "Mehedi Pathan",
    username: "mehedi",
    password: "Mehedi@123",
  },
  {
    name: "Aisha Rahman",
    username: "aisha",
    password: "Aisha@123",
  },
  {
    name: "Tanvir Ahmed",
    username: "tanvir",
    password: "Tanvir@123",
  },
  {
    name: "Nusrat Jahan",
    username: "nusrat",
    password: "Nusrat@123",
  },
  {
    name: "Fahim Hossain",
    username: "fahim",
    password: "Fahim@123",
  },
  {
    name: "Sadia Karim",
    username: "sadia",
    password: "Sadia@123",
  },
] as const;

export const TEAM_USERS = TEAM_CREDENTIALS.map((user) => user.name);

export type TeamUser = (typeof TEAM_USERS)[number];
