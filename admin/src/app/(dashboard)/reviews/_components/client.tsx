"use client";

import { useState, Fragment } from "react";
import AllReviews from "./reviews-table";

export default function ReviewsClient() {
    const [rowSelection, setRowSelection] = useState({});

    return (
        <Fragment>
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Reviews Management</h2>
                {/* Filter components could go here */}
            </div>

            <AllReviews
                rowSelection={rowSelection}
                setRowSelection={setRowSelection}
            />
        </Fragment>
    );
}
