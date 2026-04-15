export type SpokenLanguageCode = string;

export type SpokenLanguageOption = {
  code: SpokenLanguageCode;
  label: string;
  sortOrder: number;
};

export type SpokenLanguageAliasMap = Map<string, SpokenLanguageCode>;
