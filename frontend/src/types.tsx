import * as CustomSchemas from "./schemas.js"
import {z} from "zod"

export type outgoingVideoOfferType = z.infer<typeof CustomSchemas.outgoingVideoOfferSchema>
export type incomingVideoOfferType = z.infer<typeof CustomSchemas.incomingVideoOfferSchema>
export type videoAnswerType = z.infer<typeof CustomSchemas.videoAnswerSchema>
export type outgoingNewIceCandidateType = z.infer<typeof CustomSchemas.outgoingNewIceCandidateSchema>
export type incomingNewIceCandidateType = z.infer<typeof CustomSchemas.incomingNewIceCandidateSchema>
export type wsMakeUserRequestType = z.infer<typeof CustomSchemas.wsMakeUserRequestSchema>
export type disconnectVideoCallRequestType = z.infer<typeof CustomSchemas.disconnectVideoCallRequestSchema>
export type frontendType = z.infer<typeof CustomSchemas.frontendSchema>

export type makeUserRequestType = z.infer<typeof CustomSchemas.makeUserRequestSchema>
export type makeUserResponseType = z.infer<typeof CustomSchemas.makeUserResponseSchema>

export type RTCSessionDescriptionType = z.infer<typeof CustomSchemas.RTCSessionDescriptionSchema>
export type RTCIceCandidateType = z.infer<typeof CustomSchemas.RTCIceCandidateSchema>

export type landingToMainCallLocationStateType = z.infer<typeof CustomSchemas.landingToMainCallLocationStateSchema>