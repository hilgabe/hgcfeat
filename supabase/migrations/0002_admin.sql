-- E-mail que pode entrar no painel da HGC
insert into public.admins (email) values ('hilsongabrielcarvalho@gmail.com')
on conflict do nothing;
