
import { Dataset } from './types';

export const MARITIME_DATASET: Dataset = {
  name: "18th Century Maritime Trade Ledger (Fragment)",
  metadata: {
    description: "A partially recovered ledger of vessel arrivals and cargo types in the Port of Bristol, 1740-1760.",
    source: "Historical Archives Repository",
    fields: ["Date", "Vessel Name", "Origin", "Cargo", "Tonnage", "Notes"]
  },
  records: [
    { id: 1, title: "The Mermaid", date: "1742-05-12", category: "Textiles", location: "Mumbai", value: 450, description: "Arrived with silk and spices. Heavily damaged by storms." },
    { id: 2, title: "Black Adder", date: "1743-08-21", category: "Agricultural", location: "Virginia", value: 320, description: "Tobacco shipment. Crew reported high illness rates." },
    { id: 3, title: "Aurora", date: "1744-11-05", category: "Minerals", location: "Cornwall", value: 120, description: "Local tin trade. Ledger ink faded for this entry." },
    { id: 4, title: "Swift", date: "1745-01-30", category: "Textiles", location: "Calcutta", value: 550, description: "Cotton and indigo. Mention of missing manifests." },
    { id: 5, title: "HMS Endeavour", date: "1748-06-14", category: "Mixed", location: "Cape Town", value: 210, description: "Scientific instruments and diverse flora specimens." },
    { id: 6, title: "Galleon Maria", date: "1750-09-02", category: "Luxuries", location: "Seville", value: 800, description: "Wine and gold ornaments. Discrepancy in recorded weight vs observed." },
    { id: 7, title: "North Star", date: "1752-03-22", category: "Agricultural", location: "Quebec", value: 290, description: "Furs and timber. Cargo manifest lists 12 items, but only 10 arrived." },
    { id: 8, title: "Seafarer", date: "1755-12-11", category: "Textiles", location: "Lisbon", value: 400, description: "Woolen goods. Entry includes a sketch of a curious bird." },
    { id: 9, title: "Venture", date: "1758-04-05", category: "Mixed", location: "Kingston", value: 330, description: "Sugar and rum. Note: 'Two sailors jumped ship at arrival'." },
    { id: 10, title: "Explorer", date: "1760-07-20", category: "Minerals", location: "Potosi", value: 670, description: "Silver ore. High security manifest. No mention of laborers." }
  ]
};

export const SETTLER_DIARY_DATASET: Dataset = {
  name: "Diary of Elias Thorne: Upper Canada, 1861",
  metadata: {
    description: "Daily transcriptions from the personal journals of a settler near Bytown. Reflects tensions of the American Civil War and the hardships of pioneer agriculture.",
    source: "Family Papers - Thorne Collection",
    fields: ["Date", "Entry Title", "Context", "Sentiment Score", "Observations"]
  },
  records: [
    { id: "et-01", title: "The Deep Freeze", date: "1861-01-15", category: "Climate", location: "Bytown Vicinity", value: 15, description: "Mercury has dropped out of sight. The cattle are restless in the barn. Spent four hours splitting cedar. My hands are cracked like the frozen river." },
    { id: "et-02", title: "Rumblings from the South", date: "1861-02-12", category: "Politics", location: "General Store", value: 85, description: "Thomas brought a Buffalo newspaper. They speak of secession and certain war. Many here fear the disruption of the flour trade. A heavy mood at the store today." },
    { id: "et-03", title: "Maple Tapping", date: "1861-03-20", category: "Agriculture", location: "The Sugar Bush", value: 40, description: "Sap is running well despite the lingering snow. Sarah and the boys are at the camp. The sweetness is a welcome distraction from the talk of conflict." },
    { id: "et-04", title: "Fort Sumter Falls", date: "1861-04-18", category: "Politics", location: "Ottawa", value: 95, description: "The telegraph has confirmed it. The States are at war. Some of the young men speak of crossing the border to join the Union. God help them all." },
    { id: "et-05", title: "Barn Raising at Miller's", date: "1861-06-05", category: "Community", location: "Miller Farm", value: 70, description: "Eighty souls gathered to lift the frame. A fine display of neighborly spirit. We ate well of salt pork and heavy bread. For a day, the war seemed far away." },
    { id: "et-06", title: "The Summer Scorch", date: "1861-07-22", category: "Climate", location: "Wheat Fields", value: 30, description: "The heat is a physical weight. The wheat is yellowing prematurely. If the rain does not find us by Sabbath, the harvest will be a tragedy." },
    { id: "et-07", title: "A Thin Harvest", date: "1861-09-10", category: "Agriculture", location: "Granary", value: 20, description: "The yields are dismal. Barely enough to seed the next season. I must consider taking work at the lumber camps this winter to provide for Sarah." },
    { id: "et-08", title: "Confederation Talk", date: "1861-11-04", category: "Politics", location: "Town Hall", value: 50, description: "Attended a lecture on the union of the British North American provinces. Many are skeptical. They say we have enough troubles without inviting more from the Maritimes." },
    { id: "et-09", title: "The Trent Affair Panic", date: "1861-12-02", category: "Politics", location: "Border Watch", value: 90, description: "The British and the Federals are at odds over the mail steamer. Militia is drilling in the square. We are on the precipice of being dragged into the fire." },
    { id: "et-10", title: "Christmas Eve Solitude", date: "1861-12-24", category: "Personal", location: "Thorne Cabin", value: 10, description: "A quiet night. The fire is low. Sarah is sewing. I pray that 1862 brings peace to our neighbors and rain to our fields. The ink is freezing in the well." }
  ]
};

export const SAMPLE_DATASET = MARITIME_DATASET;

export const COLORS = ['#818cf8', '#fbbf24', '#f87171', '#34d399', '#a78bfa', '#f472b6'];
