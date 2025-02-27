import { propertySchema } from "./property"
import { roomSchema } from "./room"
import { bookingSchema } from "./booking"
import { userSchema } from "./user"
import { locationSchema } from "./location"
export const schema = {
  types: [propertySchema,roomSchema , bookingSchema , userSchema , locationSchema],
}
