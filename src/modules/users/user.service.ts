import { User } from "./user.model";

export const userServices = {
  findByEmail: async (email: string) => User.findOne({ email }),
  findByUsername: async (username: string) => User.findOne({ username }),
  findById: async (id: string) => User.findById(id),
};
