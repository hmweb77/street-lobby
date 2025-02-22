import { propertySchema } from "./property"
import { roomSchema } from "./room"
import { bookingSchema } from "./booking"
import { userSchema } from "./user"
export const schema = {
  types: [propertySchema,roomSchema , bookingSchema , userSchema],
}
