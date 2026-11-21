export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  kind: "guidance" | "research" | "vet-press" | "news" | "data";
  /** What the source is used for, in plain words. */
  usedFor: string;
  licence?: string;
}

/**
 * Every rule in the risk engine points at one or more of these.
 * A test checks that no rule refers to an id that is missing from this list.
 */
export const SOURCES: Record<string, Source> = {
  govukTicks: {
    id: "govukTicks",
    title: "Information on native ticks",
    publisher: "GOV.UK",
    url: "https://www.gov.uk/guidance/information-on-native-ticks",
    kind: "guidance",
    usedFor: "Where ticks live and which months they are active in the UK.",
  },
  pmcTickSurveillance: {
    id: "pmcTickSurveillance",
    title: "Surveillance for ticks and tick-borne diseases",
    publisher: "PubMed Central",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9142090",
    kind: "research",
    usedFor: "Ticks seek hosts when it stays above 7 °C for about 5 days and the air is not too dry.",
  },
  mcginleyTicks: {
    id: "mcginleyTicks",
    title: "Spatiotemporal activity of the Ixodes ricinus tick in England",
    publisher: "University thesis (Liz McGinley)",
    url: "https://core.ac.uk/download/227453286.pdf",
    kind: "research",
    usedFor: "Peak spring tick activity followed seven days in a row at 7 °C or above.",
  },
  pmcTicksEurope: {
    id: "pmcTicksEurope",
    title: "Overview of ticks in Europe",
    publisher: "PubMed Central",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5198687",
    kind: "research",
    usedFor: "Ticks prefer humidity above about 80% and are more active after rain.",
  },
  springerTickClimate: {
    id: "springerTickClimate",
    title: "What have 40 years of climate change done to Europe's most common tick?",
    publisher: "Springer Nature Communities",
    url: "https://communities.springernature.com/amp/posts/what-have-40-years-of-climate-change-done-to-europe-s-most-common-tick",
    kind: "research",
    usedFor: "Humidity decides how long ticks stay out questing before they must shelter.",
  },
  pdsaHarvest: {
    id: "pdsaHarvest",
    title: "Harvest mites in dogs",
    publisher: "PDSA",
    url: "https://pdsa.org.uk/pet-help-and-advice/pet-health-hub/conditions/harvest-mites-in-dogs",
    kind: "vet-press",
    usedFor: "Harvest mites live in woodland and grassy areas and are most active from July to November.",
  },
  vetlexiconHarvest: {
    id: "vetlexiconHarvest",
    title: "Neotrombicula autumnalis",
    publisher: "VetLexicon",
    url: "https://www.vetlexicon.com/treat/canis/bug/neotrombicula-autumnalis",
    kind: "vet-press",
    usedFor: "Harvest mites favour grassland, heathland and scrubby woodland.",
  },
  scotsmanHarvest: {
    id: "scotsmanHarvest",
    title: "Harvest mites and dogs: symptoms, treatment and prevention tips",
    publisher: "The Scotsman",
    url: "https://www.scotsman.com/lifestyle/family/harvest-mites-and-dogs-as-cases-of-the-parasites-soar-heres-what-the-symptoms-are-treatment-and-prevention-tips-8817452",
    kind: "news",
    usedFor: "Harvest mites are most active in warm, dry spells in late summer and early autumn.",
  },
  fourPawsHarvest: {
    id: "fourPawsHarvest",
    title: "Harvest mites on pets",
    publisher: "FOUR PAWS UK",
    url: "https://www.four-paws.org.uk/our-stories/publications-guides/harvest-mites-in-pets",
    kind: "vet-press",
    usedFor: "Harvest mites can affect cats as well as dogs.",
  },
  vetTimesFleas: {
    id: "vetTimesFleas",
    title: "Argument for year-round flea treatment in UK cats and dogs",
    publisher: "Vet Times",
    url: "https://www.vettimes.com/clinical/small-animal/argument-for-year-round-flea-treatment-in-uk-cats-and-dogs",
    kind: "vet-press",
    usedFor: "Fleas can be a problem at any time of year in the UK because of centrally heated homes.",
  },
  vetHelpDirectFleas: {
    id: "vetHelpDirectFleas",
    title: "Dogs can get fleas in winter",
    publisher: "Vet Help Direct",
    url: "https://vethelpdirect.com/?p=46196",
    kind: "vet-press",
    usedFor: "Fleas do best at 18 to 25 °C and 70 to 85% humidity.",
  },
  paLungworm: {
    id: "paLungworm",
    title: "Thousands of dogs could be at risk from deadly parasite, vets warn",
    publisher: "The Scotsman (PA)",
    url: "https://www.scotsman.com/read-this/thousands-of-dogs-could-be-at-risk-from-deadly-parasite-vets-warn-3277876",
    kind: "news",
    usedFor:
      "Damp weather makes slugs and snails more active. Dogs pick up lungworm from slugs, snails and slime, including on grass.",
  },
  vetTimesLungworm: {
    id: "vetTimesLungworm",
    title: "Angiostrongylus vasorum: where is it, and what are the risks?",
    publisher: "Vet Times",
    url: "https://vettimes.co.uk/?p=282904",
    kind: "vet-press",
    usedFor: "Lungworm affects dogs in the UK and is more common in some areas, including the south-east.",
  },
  vnjLungworm: {
    id: "vnjLungworm",
    title: "Understanding the risk of parasitic disease (VNJ, April 2026)",
    publisher: "Veterinary Nursing Journal (BVNA)",
    url: "https://vnj.bvna.org.uk/vnj-volume-41-2-april-2026/0080961001773737105/p21",
    kind: "vet-press",
    usedFor: "Lungworm transmission is highest in late summer and autumn, with some risk all year.",
  },
  openMeteo: {
    id: "openMeteo",
    title: "Open-Meteo weather forecast API",
    publisher: "Open-Meteo",
    url: "https://open-meteo.com/",
    kind: "data",
    usedFor: "Hourly temperature, humidity, rain and soil moisture, for the past week and the week ahead.",
    licence: "CC BY 4.0",
  },
  postcodesIo: {
    id: "postcodesIo",
    title: "postcodes.io",
    publisher: "postcodes.io",
    url: "https://postcodes.io/",
    kind: "data",
    usedFor: "Turns a UK postcode into a place name and a point on the map.",
    licence: "Open data (see postcodes.io)",
  },
  vmd: {
    id: "vmd",
    title: "Product Information Database",
    publisher: "Veterinary Medicines Directorate (Defra)",
    url: "https://www.vmd.defra.gov.uk/ProductInformationDatabase/",
    kind: "data",
    usedFor: "Which active ingredients are authorised for which animals in the UK.",
    licence: "Open Government Licence v3.0",
  },
  govukVetMedsAdvertising: {
    id: "govukVetMedsAdvertising",
    title: "Advertising veterinary medicines",
    publisher: "GOV.UK",
    url: "https://www.gov.uk/guidance/advertising-veterinary-medicines",
    kind: "guidance",
    usedFor: "Why Heedwell names ingredients and never products, and has no buy buttons.",
  },
};

export const sourcesFor = (ids: string[]): Source[] =>
  ids.map((id) => SOURCES[id]).filter((s): s is Source => Boolean(s));
