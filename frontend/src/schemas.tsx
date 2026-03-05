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

export const frontendSchema=z.union([videoOfferSchema,videoAnswerSchema,newIceCandidateSchema])

export const makeUserSchema=z.object({
    type:z.literal("make-user"),
    username:z.string(),
    roomCode:z.string()
})
