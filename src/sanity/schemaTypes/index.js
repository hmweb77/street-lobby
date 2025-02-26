import { propertySchema } from "./property"
import { roomSchema } from "./room"
import { bookingSchema } from "./booking"
import { userSchema } from "./user"
import { locationSchema } from "./location"
import { orderSchema } from "./order"
export const schema = {
  types: [propertySchema,roomSchema , bookingSchema , userSchema , locationSchema , orderSchema],
}
