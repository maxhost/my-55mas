import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { listMembers } from '@/features/members/actions/list-members';
import {
  getCountryOptions,
  getCityOptions,
  getTeamOptions,
  getRoleOptions,
} from '@/features/members/actions/get-filter-options';
import { PageHeader } from '@/shared/components/page-header';
import { MembersList } from '@/features/members/components/members-list';

type Props = { params: { locale: string } };

export default async function MembersPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminMembers');

  const [members, countries, cities, teams, roles] = await Promise.all([
    listMembers({ locale }),
    getCountryOptions(locale),
    getCityOptions(locale),
    getTeamOptions(),
    getRoleOptions(),
  ]);

  return (
    <div className="p-8">
      <PageHeader title={t('title')} />
      <MembersList
        members={members}
        countryOptions={countries}
        cityOptions={cities}
        teamOptions={teams}
        roleOptions={roles}
      />
    </div>
  );
}
