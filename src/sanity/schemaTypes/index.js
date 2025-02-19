import { propertySchema } from "./property"
import { roomSchema } from "./room"
import { bookingSchema } from "./booking"
export const schema = {
  types: [propertySchema,roomSchema , bookingSchema],
}
