import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        subscriptionPlan: {
            type: String,
            enum: ["trial", "pro", "enterprise"],
            default: "trial",
        },
        subscriptionExpiredAt: {
            type: Date,
        },
        owner: {
            // siapa pemilik utama
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserRefrensi",
            required: true,
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "UserRefrensi",
            },
        ],
        features: {
            // kalau mau limit fitur
            maxAccount: {
                type: Number,
                default: 5,
            },
            maxOutlet: {
                type: Number,
                default: 5
            }
        },
        outletId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Outlet",
        }
    },
    { timestamps: true }
);

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;
