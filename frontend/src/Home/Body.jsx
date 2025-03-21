import React, { useEffect, useState } from "react";
import axios from "axios"; // Import axios
import HomeBanner from "./HomeBanner";
import ArtItems from "./ArtItems";

export default function Body() {
    const [artData, setArtData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get("http://localhost:8080/product/list");
                setArtData(res.data.products); // Assuming API returns { products: [...] }
            } catch (error) {
                console.error("Error fetching products:", error);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            <HomeBanner />
            <ArtItems items={artData} />
        </div>
    );
}
