// array of research items
// export type ResearchProps = {
//     research: {
//         title: string;
//         link: string;
//     }[];
// };

export const Research = ({ research }:any) => {
    // console.log(research);
    return (
        <div className="bg-purple-500 p-4 rounded-lg shadow-md border border-gray-200 w-fit">
            <h2 className="text-2xl font-bold text-white">Research</h2> 
            {research.citations.map((item:any, index:any) => (
                <div key={index}>
                    <h3 className="text-white">{item}</h3>
                </div>
            ))}
        </div>
    );
};