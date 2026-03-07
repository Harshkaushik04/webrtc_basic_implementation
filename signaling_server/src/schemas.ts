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

export const videoOfferSchema=z.object({
    type:z.literal("video-offer"),
    username:z.string(),
    target:z.string(),
    sdp:RTCSessionDescriptionSchema
})

export const videoAnswerSchema=z.object({
    type:z.literal("video-answer"),
    username:z.string(),
    target:z.string(),
    sdp:RTCSessionDescriptionSchema
})

export const newIceCandidateSchema=z.object({
    type:z.literal("new-ice-candidate"),
    target:z.string(),
    candidate:RTCIceCandidateSchema
})

export const wsMakeUserRequestSchema=z.object({ //not sending roomCode because that logic is handled by http server
    type:z.literal("make-user"),
    username:z.string()
})

export const frontendSchema=z.union([videoOfferSchema,videoAnswerSchema,newIceCandidateSchema,wsMakeUserRequestSchema])

export const makeUserRequestSchema=z.object({
    type:z.literal("make-user"),
    username:z.string(),
    roomCode:z.string()
})

export const makeUserResponseSchema=z.object({
    type:z.literal("make-user"),
    success:z.enum(["yes","no"]),
    role:z.enum(["caller","callee"]),
    targetUsername:z.string(),
    error:z.optional(z.string())
})


export const landingToMainCallLocationState=z.object({
    username:z.string(),
    roomID:z.string(),
    role:z.enum(["caller","callee"]),
    targetUsername:z.string()
})