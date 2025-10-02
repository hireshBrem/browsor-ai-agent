export type WeatherProps = {
    temperature: number;
    weather: string;
    location: string;
};
  
export const Weather: React.FC<WeatherProps> = ({temperature, weather, location}) => {
    return (
      <div className="bg-purple-500 p-4 rounded-lg shadow-md border border-gray-200 w-fit">
        <h2 className="text-2xl font-bold text-red-500 border-2 border-red-500">Current Weather for {location}</h2>
        <p className="text-red-500">Condition: {weather}</p>
        <p className="text-red-500">Temperature: {temperature}°C</p>
      </div>
    );
};