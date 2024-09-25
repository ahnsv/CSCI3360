import {TopLevelSpec} from "vega-lite";
import React from "react";
import {VegaLite} from "react-vega";

type VegaChartProps = {
    spec: TopLevelSpec
}

const VegaChart: React.FC<VegaChartProps> = ({spec}) => {
    console.log(spec)
    return (
        <div>
            <VegaLite spec={spec}/>
        </div>
    )
}

export default VegaChart