<?php

namespace Database\Seeders;

use App\Models\Lead;
use App\Models\LeadHistory;
use App\Models\User;
use Illuminate\Database\Seeder;

class LeadSeeder extends Seeder
{
    public function run(): void
    {
        $users  = User::all();
        $admin  = $users->firstWhere('role', 'admin');
        $agents = $users->where('role', 'user')->values();

        $statuses = ['New', 'Contacted', 'Interested', 'Negotiation', 'Won', 'Lost'];
        $sources  = ['LinkedIn', 'Referral', 'Cold call', 'Website', 'Other'];

        $leadsData = [
            ['name' => 'Alex Thompson',   'email' => 'alex.t@techcorp.com',      'company' => 'TechCorp',       'phone' => '+1-555-0101'],
            ['name' => 'Priya Patel',     'email' => 'priya@innovate.io',        'company' => 'Innovate.io',    'phone' => '+1-555-0102'],
            ['name' => 'Carlos Rivera',   'email' => 'c.rivera@globalnet.com',   'company' => 'GlobalNet',      'phone' => '+1-555-0103'],
            ['name' => 'Sophie Laurent',  'email' => 's.laurent@frenchtech.fr',  'company' => 'FrenchTech',     'phone' => '+33-555-0104'],
            ['name' => 'David Kim',       'email' => 'dkim@seoulsoft.kr',        'company' => 'SeoulSoft',      'phone' => '+82-555-0105'],
            ['name' => 'Rachel Green',    'email' => 'r.green@mediahouse.com',   'company' => 'Media House',    'phone' => '+1-555-0106'],
            ['name' => 'Tom Bradley',     'email' => 'tom@productionco.com',     'company' => 'Production Co',  'phone' => '+1-555-0107'],
            ['name' => 'Nina Rossi',      'email' => 'n.rossi@italiadesign.it',  'company' => 'Italia Design',  'phone' => '+39-555-0108'],
            ['name' => 'Ben Okafor',      'email' => 'b.okafor@afrotech.ng',     'company' => 'AfroTech',       'phone' => '+234-555-0109'],
            ['name' => 'Laura Schmidt',   'email' => 'l.schmidt@deutsch.de',     'company' => 'Deutsch GmbH',   'phone' => '+49-555-0110'],
            ['name' => 'Hassan Al-Farsi', 'email' => 'hassan@middleeastco.ae',   'company' => 'MiddleEast Co',  'phone' => '+971-555-0111'],
            ['name' => 'Maria Santos',    'email' => 'm.santos@braziltech.br',   'company' => 'BrazilTech',     'phone' => '+55-555-0112'],
            ['name' => 'Ethan Cole',      'email' => 'e.cole@startupx.com',      'company' => 'StartupX',       'phone' => '+1-555-0113'],
            ['name' => 'Yuki Tanaka',     'email' => 'y.tanaka@tokyodigital.jp', 'company' => 'Tokyo Digital',  'phone' => '+81-555-0114'],
            ['name' => 'Amelia Jones',    'email' => 'a.jones@ukenterp.co.uk',   'company' => 'UK Enterprise',  'phone' => '+44-555-0115'],
            ['name' => 'Omar Sharif',     'email' => 'o.sharif@cairosoft.eg',    'company' => 'CairoSoft',      'phone' => '+20-555-0116'],
            ['name' => 'Isabella Ricci',  'email' => 'i.ricci@milanotech.it',    'company' => 'MilanoTech',     'phone' => '+39-555-0117'],
            ['name' => 'Jack Williams',   'email' => 'j.williams@aussie.com.au', 'company' => 'Aussie Corp',    'phone' => '+61-555-0118'],
            ['name' => 'Fatima Malik',    'email' => 'f.malik@paksoft.pk',       'company' => 'PakSoft',        'phone' => '+92-555-0119'],
            ['name' => 'Leo Mueller',     'email' => 'l.muller@berlindev.de',    'company' => 'BerlinDev',      'phone' => '+49-555-0120'],
            ['name' => 'Grace Obi',       'email' => 'g.obi@lagostech.ng',       'company' => 'LagosTech',      'phone' => '+234-555-0121'],
            ['name' => 'Nathan Ford',     'email' => 'n.ford@leverage.com',      'company' => 'Leverage Inc',   'phone' => '+1-555-0122'],
            ['name' => 'Chloe Dupont',    'email' => 'c.dupont@parisdev.fr',     'company' => 'ParisDev',       'phone' => '+33-555-0123'],
            ['name' => 'Ryan Chang',      'email' => 'r.chang@hongkongb.hk',     'company' => 'HK Business',    'phone' => '+852-555-0124'],
            ['name' => 'Aisha Kamara',    'email' => 'a.kamara@westafrica.com',  'company' => 'West Africa Co', 'phone' => '+232-555-0125'],
            ['name' => 'Patrick Brien',   'email' => 'p.brien@dublintech.ie',    'company' => 'Dublin Tech',    'phone' => '+353-555-0126'],
            ['name' => 'Mei Lin',         'email' => 'm.lin@shanghaidev.cn',     'company' => 'ShangDev',       'phone' => '+86-555-0127'],
            ['name' => 'Samuel Torres',   'email' => 's.torres@mexicosoft.mx',   'company' => 'MexicoSoft',     'phone' => '+52-555-0128'],
            ['name' => 'Eva Novak',       'email' => 'e.novak@pragueit.cz',      'company' => 'PragueIT',       'phone' => '+420-555-0129'],
            ['name' => 'Chris Anderson',  'email' => 'c.anderson@nordtech.se',   'company' => 'NordTech',       'phone' => '+46-555-0130'],
        ];

        $actions = ['Lead created', 'Email sent', 'Call made', 'Meeting scheduled', 'Proposal sent'];

        foreach ($leadsData as $i => $data) {
            $agent  = $agents[$i % $agents->count()];
            $status = $statuses[$i % count($statuses)];
            $source = $sources[$i % count($sources)];

            $lead = Lead::withoutEvents(function () use ($data, $status, $source, $admin, $agent) {
                return Lead::create(array_merge($data, [
                    'id'             => (string) \Illuminate\Support\Str::uuid(),
                    'status'         => $status,
                    'source'         => $source,
                    'notes'          => 'Initial contact made. Follow up scheduled.',
                    'created_by_id'  => $admin->id,
                    'assigned_to_id' => $agent->id,
                ]));
            });

            $count = rand(2, 4);
            for ($j = 0; $j < $count; $j++) {
                LeadHistory::create([
                    'lead_id'    => $lead->id,
                    'user_id'    => $agent->id,
                    'action'     => $actions[$j % count($actions)],
                    'old_value'  => null,
                    'new_value'  => null,
                    'created_at' => now()->subDays(rand(1, 30)),
                ]);
            }
        }
    }
}
