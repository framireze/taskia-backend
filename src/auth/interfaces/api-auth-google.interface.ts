import { ApiResponse } from "./api-response.interface";

export interface ApiAuthGoogle extends ApiResponse<string> {
    success: boolean;
    message: string;
    data: string;
}