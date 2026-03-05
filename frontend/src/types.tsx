import * as CustomSchemas from "./schemas.js"
import {z} from "zod"

export type videoOfferType = z.infer<typeof CustomSchemas.videoOfferSchema>
export type videoAnswerType = z.infer<typeof CustomSchemas.videoAnswerSchema>
export type newIceCandidateType = z.infer<typeof CustomSchemas.newIceCandidateSchema>
export type frontendType = z.infer<typeof CustomSchemas.frontendSchema>

export type makeUserType = z.infer<typeof CustomSchemas.makeUserSchema>

export type RTCSessionDescriptionType = z.infer<typeof CustomSchemas.RTCSessionDescriptionSchema>
export type RTCIceCandidateType = z.infer<typeof CustomSchemas.RTCIceCandidateSchema>
