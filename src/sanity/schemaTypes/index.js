import { propertySchema } from "./property"
import { roomSchema } from "./room"
import { bookingSchema } from "./booking"
import { userSchema } from "./user"
import { locationSchema } from "./location"
import settings from "./settings"
import { propertiesMap } from "./propertiesmap"
export const schema = {
  types: [propertySchema,roomSchema , bookingSchema , userSchema , locationSchema,settings,propertiesMap],
}
