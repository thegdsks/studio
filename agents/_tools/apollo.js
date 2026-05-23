export async function apolloSearch(titles, keywords) {
    const apiKey = process.env.APOLLO_API_KEY;
    if (!apiKey) {
        console.warn("Apollo API key not set, skipping live lookup");
        return [];
    }
    const url = "https://api.apollo.io/api/v1/mixed_people/api_search";
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000); // 10s timeout
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                "X-Api-Key": apiKey
            },
            body: JSON.stringify({
                person_titles: titles,
                q_organization_keyword_tags: keywords,
                per_page: 10,
                page: 1
            }),
            signal: controller.signal
        });
        clearTimeout(timer);
        if (!response.ok) {
            console.warn(`Apollo API responded with status ${response.status}`);
            return [];
        }
        const data = (await response.json());
        const people = data.people || [];
        return people.map((person) => ({
            name: `${person.first_name || ""} ${person.last_name || ""}`.trim(),
            role: person.title || "Key Decision Maker",
            company: person.organization?.name || "Unknown Company",
            linkedin: person.linkedin_url || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(person.first_name + " " + person.last_name)}`,
            email: person.email || undefined
        }));
    }
    catch (err) {
        console.warn("Apollo search failed:", err);
        return [];
    }
}
