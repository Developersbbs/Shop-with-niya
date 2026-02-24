
import axiosInstance from "@/helpers/axiosInstance";
import { RatingsResponse, FetchRatingsParams } from "./types";

export const fetchRatings = async ({
    page = 1,
    limit = 10,
    search = "",
    status = "all",
}: FetchRatingsParams): Promise<RatingsResponse> => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        status,
    });

    const { data } = await axiosInstance.get(`/api/ratings?${params.toString()}`);

    if (!data.success) {
        throw new Error(data.error || "Failed to fetch ratings");
    }

    return data;
};
