export interface JSONItemAttribute {
  trait_type: string;
  value: string | number;
}

export interface JSONInscription {
  ethscription_id: string;
  name: string;
  description: string;
  external_url: string;
  background_color: string;
  item_index: number;
  item_attributes: JSONItemAttribute[];
}

export interface JSONCollection {
  name: string;
  description: string;
  total_supply: number;
  logo_image_uri: string;
  banner_image_uri: string;
  background_color: string;
  twitter_link: string;
  website_link: string;
  discord_link: string;
  collection_items: JSONInscription[];
}