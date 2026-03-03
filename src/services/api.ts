import axios from "axios";

const BASE_URL = "https://saavn.sumit.co/api";

export const searchSongs = async(query:String,page:number=1)=>{

    try {
        const response = await axios.get(`${BASE_URL}/search/songs`,{
            params:{
                query,
                page,
                limit:20
            }});
        return response.data.results;
    } catch (error) {
        console.error("Error searching songs API:", error);
        return [];
    }
}