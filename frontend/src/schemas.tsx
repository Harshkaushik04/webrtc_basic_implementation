import { z } from "zod"

export const RTCSessionDescriptionSchema = z.custom<RTCSessionDescriptionInit>(
    (val)=>{
        return typeof val === "object" && val!=null
    },"Expected as RTCSessionDescriptionInit object"
)

export const RTCIceCandidateSchema = z.custom<RTCIceCandidateInit>(
    (val)=>{
        return typeof val === "object" && val!=null
    },"Expected as RTCIceCandidateInit object"
)

export const outgoingVideoOfferSchema=z.object({
    type:z.literal("video-offer-outgoing"),
    username:z.string(),
    target:z.string(),
    sdp:RTCSessionDescriptionSchema
})

export const incomingVideoOfferSchema=z.object({
    type:z.literal("video-offer-incoming"),
    username:z.string(),
    sdp:RTCSessionDescriptionSchema
})

export const videoAnswerSchema=z.object({
    type:z.literal("video-answer"),
    username:z.string(),
    target:z.string(),
    sdp:RTCSessionDescriptionSchema
})

export const outgoingNewIceCandidateSchema=z.object({
    type:z.literal("new-ice-candidate-outgoing"),
    username:z.string(),
    target:z.string(),
    candidate:RTCIceCandidateSchema
})

export const incomingNewIceCandidateSchema=z.object({
    type:z.literal("new-ice-candidate-incoming"),
    username:z.string(),
    candidate:RTCIceCandidateSchema
})

export const wsMakeUserRequestSchema=z.object({ //not sending roomCode because that logic is handled by http server
    type:z.literal("make-user"),
    username:z.string()
})

export const frontendSchema=z.union([incomingVideoOfferSchema,outgoingVideoOfferSchema,videoAnswerSchema,outgoingNewIceCandidateSchema,incomingNewIceCandidateSchema,wsMakeUserRequestSchema])

export const makeUserRequestSchema=z.object({
    type:z.literal("make-user"),
    username:z.string(),
    roomCode:z.string()
})

export const makeUserResponseSchema=z.object({
    type:z.literal("make-user"),
    success:z.enum(["yes","no"]),
    role:z.enum(["caller","callee","nothing"]),
    targetUsernames:z.array(z.string()),
    error:z.optional(z.string())
})


export const landingToMainCallLocationStateSchema=z.object({
    username:z.string(),
    roomID:z.string(),
    role:z.enum(["caller","callee","nothing"]),
    targetUsernames:z.array(z.string())
})